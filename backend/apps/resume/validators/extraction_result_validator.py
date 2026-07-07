"""
Validation/sanitisation for the output of any `IResumeExtractionProvider`
(mock, OpenAI, Gemini, or a future provider).

LLM- and regex-derived data cannot be trusted blindly before it lands in
Postgres: a model can hallucinate a 400-year "experience_years", return a
skill name longer than the `ExtractedSkill.name` column, wrap education
entries in the wrong shape, or return a multi-page "summary". This
validator is the single choke point (SRP) all extraction results pass
through in `ExtractionService` before being saved, regardless of which
provider produced them.

It never raises for merely *messy* data - it coerces/truncates/drops the
offending piece and logs a warning, so a provider hiccup degrades
gracefully instead of failing the whole pipeline. It only raises
`ValidationError` when the result is structurally unusable (wrong type
entirely), which indicates a provider integration bug rather than noisy
model output.
"""
import dataclasses
import logging
from typing import Any

from core.exceptions import ValidationError

from apps.ai.providers.llm.interfaces import ResumeExtractionResult

logger = logging.getLogger("smarthire")


class ResumeExtractionValidator:
    """Validates and sanitises a `ResumeExtractionResult` before persistence."""

    MAX_SKILL_LENGTH = 120  # must match ExtractedSkill.name max_length
    MAX_SKILLS = 60
    MAX_TECHNOLOGIES = 60
    MAX_EDUCATION_ENTRIES = 20
    MAX_SUMMARY_LENGTH = 2000
    MAX_EXPERIENCE_YEARS = 60.0
    MIN_EXPERIENCE_YEARS = 0.0

    def validate(self, result: ResumeExtractionResult) -> ResumeExtractionResult:
        if result is None or not hasattr(result, "skills"):
            raise ValidationError("Extraction provider returned an unusable result.")

        cleaned_fields = dict(
            skills=self._clean_string_list(result.skills, max_items=self.MAX_SKILLS, field="skills"),
            technologies=self._clean_string_list(
                result.technologies, max_items=self.MAX_TECHNOLOGIES, field="technologies"
            ),
            experience_years=self._clean_experience_years(result.experience_years),
            education=self._clean_education(result.education),
            summary=self._clean_summary(result.summary),
            raw_text=result.raw_text or "",
        )

        if dataclasses.is_dataclass(result):
            return dataclasses.replace(result, **cleaned_fields)

        # Fallback for a plain (non-dataclass) result type: rebuild it via
        # its own constructor so this validator doesn't depend on
        # `ResumeExtractionResult`'s exact implementation.
        try:
            return type(result)(**cleaned_fields)
        except TypeError:
            for field, value in cleaned_fields.items():
                setattr(result, field, value)
            return result

    def _clean_string_list(self, values: Any, *, max_items: int, field: str) -> list[str]:
        if not isinstance(values, (list, tuple, set)):
            logger.warning("Extraction '%s' was not a list (got %s); coercing to empty list.", field, type(values))
            return []

        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            if not isinstance(value, str):
                continue
            item = value.strip()
            if not item:
                continue
            if len(item) > self.MAX_SKILL_LENGTH:
                item = item[: self.MAX_SKILL_LENGTH]
            key = item.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(item)
            if len(cleaned) >= max_items:
                break
        return cleaned

    def _clean_experience_years(self, value: Any) -> float:
        try:
            years = float(value)
        except (TypeError, ValueError):
            logger.warning("Extraction 'experience_years' was not numeric (got %r); defaulting to 0.", value)
            return 0.0

        if years != years:  # NaN check without importing math
            return 0.0
        years = max(self.MIN_EXPERIENCE_YEARS, min(years, self.MAX_EXPERIENCE_YEARS))
        return round(years, 1)

    def _clean_education(self, values: Any) -> list[dict]:
        if not isinstance(values, (list, tuple)):
            logger.warning("Extraction 'education' was not a list (got %s); coercing to empty list.", type(values))
            return []

        cleaned: list[dict] = []
        for entry in values:
            if not isinstance(entry, dict):
                continue
            degree = str(entry.get("degree", "")).strip()
            if not degree:
                continue
            institution = str(entry.get("institution", "")).strip()
            item = {"degree": degree[: self.MAX_SKILL_LENGTH]}
            if institution:
                item["institution"] = institution[: self.MAX_SKILL_LENGTH]
            # Preserve any other simple string/number fields a provider
            # legitimately supplied (e.g. raw_match from the mock provider,
            # year from an LLM) without letting arbitrary nested/huge
            # values through.
            for key, val in entry.items():
                if key in item:
                    continue
                if isinstance(val, (str, int, float)) and len(str(val)) <= self.MAX_SKILL_LENGTH:
                    item[key] = str(val)
            cleaned.append(item)
            if len(cleaned) >= self.MAX_EDUCATION_ENTRIES:
                break
        return cleaned

    def _clean_summary(self, value: Any) -> str:
        if not isinstance(value, str):
            return ""
        summary = value.strip()
        if len(summary) > self.MAX_SUMMARY_LENGTH:
            summary = summary[: self.MAX_SUMMARY_LENGTH].rstrip() + "..."
        return summary
