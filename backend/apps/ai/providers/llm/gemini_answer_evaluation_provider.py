"""
Gemini-backed thread evaluation and interview brief provider.

Two providers in one file since they share the same SDK setup,
temperature config, and JSON parsing logic.

GeminiThreadEvaluationProvider
    Called when a topic thread ends (ask_next_question fires).
    Evaluates the FULL conversation on that topic — not one turn.
    Scores what Gemini can actually observe:
      - depth_under_pressure  (did answers deepen or collapse when probed)
      - conceptual_accuracy   (right terminology in context, not buzzwords)
      - specificity           (concrete details vs vague claims)
      - recovery              (handled being wrong gracefully)

GeminiInterviewBriefProvider
    Called once after the full interview ends.
    Reads all thread evaluation results and writes a brief for
    the human making the hire decision — not a score, a structured
    set of observations and follow-up questions.
"""
import json
import logging

from django.conf import settings

from apps.ai.providers.llm.answer_evaluation_interfaces import (
    InterviewBriefResult,
    IInterviewBriefProvider,
    IThreadEvaluationProvider,
    ThreadEvaluationResult,
)
from core.exceptions import ExternalServiceError

logger = logging.getLogger("smarthire")

_MODEL = "gemini-2.5-flash"
_TEMPERATURE = 0.2
_MAX_RETRIES = 2

# ---------------------------------------------------------------------------
# Thread evaluation prompt
# ---------------------------------------------------------------------------
_THREAD_PROMPT = """\
You are evaluating interview performance on ONE topic thread.
You do NOT have access to ground truth about the candidate's actual projects.
Do not penalise or reward based on whether their claimed experience is real.
Score ONLY what you can observe from the conversation text.

Interview context
-----------------
Type       : {interview_type}
Domain     : {domain}
Difficulty : {difficulty}

Seed topic (internal interviewer guide — NOT what was literally asked):
{seed_topic_text}

Concepts that indicate genuine understanding of this topic
(a candidate who explains ONE concept deeply beats one who name-drops all):
{expected_topics_block}

Full conversation on this topic
--------------------------------
{conversation_block}

Scoring dimensions (0–10, one decimal place each)
---------------------------------------------------
depth_under_pressure
  The most important signal. Did the candidate's answers get DEEPER or
  SHALLOWER when the interviewer probed? Deeper = high score. Shorter,
  vaguer, or contradictory under follow-up = low score.

conceptual_accuracy
  Did they use terminology correctly IN CONTEXT, not just name-drop it?
  Did they explain HOW and WHY, not just WHAT? Generic textbook
  definitions with no applied understanding = low score.

specificity
  Concrete details (actual numbers, failure modes, tradeoffs, things
  that went wrong) vs generic claims ("we optimised it", "it was faster",
  "we used best practices"). Vague claims with no mechanism = low score.

recovery
  When the interviewer probed something vague or wrong, did they
  course-correct with a real answer, or double down on the vagueness?
  Only score this if there was a probing moment — set 5.0 (neutral)
  if there was no probe.

overall_score
  Weighted: depth_under_pressure×0.35 + conceptual_accuracy×0.35 +
            specificity×0.2 + recovery×0.1

verdict
  Choose exactly one:
  "strong"       — Answered well and held up under probing
  "surface"      — Reasonable first answer but couldn't go deeper
  "bluffing"     — Confident claims that collapsed or contradicted under probing
  "weak"         — Could not answer meaningfully
  "insufficient" — Too few candidate turns to assess (< 2 candidate turns)

red_flags
  Up to 3 SPECIFIC quotes or observations from THIS conversation that
  suggest surface-level knowledge or bluffing. Must reference something
  they actually said. Empty list if none.
  Example: "Said 'we used distributed locking' but couldn't name the
  mechanism when asked — answered 'just Redis' with no detail"

strong_signals
  Up to 3 SPECIFIC quotes or observations that suggest genuine experience.
  Must reference something they actually said, not generic praise.
  Example: "Unprompted mentioned the race condition risk during backfill
  before the interviewer raised it"

suggested_followups
  Up to 2 targeted questions for the NEXT human interview round to probe
  weaknesses or verify claims from this thread. Make them specific to
  what was said, not generic interview questions.
  Example: "They said they 'used locks' during the migration — ask them
  to name the locking strategy and explain why they chose it over
  optimistic concurrency"

requires_human_review
  true if verdict is "bluffing" OR if you detected a direct contradiction
  within the thread. false otherwise.

human_review_reason
  One sentence explaining why human review is needed. Empty string if
  requires_human_review is false.

Respond ONLY with valid JSON matching the schema. No markdown, no preamble.
"""

_THREAD_SCHEMA = {
    "type": "object",
    "properties": {
        "depth_under_pressure": {"type": "number"},
        "conceptual_accuracy": {"type": "number"},
        "specificity": {"type": "number"},
        "recovery": {"type": "number"},
        "overall_score": {"type": "number"},
        "verdict": {"type": "string"},
        "red_flags": {"type": "array", "items": {"type": "string"}},
        "strong_signals": {"type": "array", "items": {"type": "string"}},
        "suggested_followups": {"type": "array", "items": {"type": "string"}},
        "requires_human_review": {"type": "boolean"},
        "human_review_reason": {"type": "string"},
    },
    "required": [
        "depth_under_pressure", "conceptual_accuracy", "specificity",
        "recovery", "overall_score", "verdict", "red_flags",
        "strong_signals", "suggested_followups",
        "requires_human_review", "human_review_reason",
    ],
}

# ---------------------------------------------------------------------------
# Interview brief prompt
# ---------------------------------------------------------------------------
_BRIEF_PROMPT = """\
You have just evaluated all topic threads in a {interview_type} interview
for a {domain} role ({difficulty} difficulty).

Here are the results per topic:
{thread_results_block}

Write a structured brief for the human recruiter or hiring manager who
will decide whether to advance this candidate. Your job is NOT to make
the hire decision — it is to give the human everything they need to make
a sharp, informed decision and to make the next interview round much more
targeted if they advance.

Fields to return
----------------

overall_signal
  One of: "strong" | "mixed" | "surface" | "inconsistent"
  "strong"       — Performed well across most topics, held up under pressure
  "mixed"        — Strong on some topics, weak on others (note the pattern)
  "surface"      — Stayed at surface level across all topics
  "inconsistent" — Large variance, possible bluffing on specific topics

summary
  2–3 paragraphs written for a recruiter. State what the candidate is
  genuinely strong in, where they showed gaps, and the single most
  important thing the next interviewer should probe. Do not use bullet
  points here — write in clear prose.

performs_under_pressure
  true if answers consistently DEEPENED under follow-up probing across
  most threads. false if they tended to get shorter or vaguer.

specificity_consistent
  true if the candidate gave concrete details consistently across topics.
  false if they tended toward generic claims.

self_contradictions_detected
  true if the candidate said something in one thread that directly
  contradicts something in another thread.

contradiction_detail
  If self_contradictions_detected is true: exactly what was contradicted
  and in which topics. Empty string otherwise.

red_flags
  Up to 5 cross-topic red flags — patterns that showed up in multiple
  threads, not just one-off moments. Reference specific topics.

strong_signals
  Up to 5 cross-topic strong signals — patterns that suggest genuine
  depth or experience across multiple topics.

suggested_followup_questions
  Exactly 3 highly specific follow-up questions for the next human
  interview round. Each question should:
  - Target a specific weakness, contradiction, or unverified claim
  - Reference what the candidate actually said
  - Explain in a parenthetical WHY this question will separate genuine
    experience from surface knowledge
  Example:
  "In topic 2 they said 'we handled 50M rows with zero downtime' but
  couldn't name the migration strategy when probed — ask: 'Walk me
  through the exact migration steps for that 50M row table, including
  what happened to in-flight writes during the backfill.'
  (Someone who actually did this answers immediately with a mechanism;
  someone who read about it gives a vague process description)"

requires_human_review
  true if any thread had verdict "bluffing" OR if self_contradictions
  were detected.

Respond ONLY with valid JSON. No markdown, no preamble.
"""

_BRIEF_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_signal": {"type": "string"},
        "summary": {"type": "string"},
        "performs_under_pressure": {"type": "boolean"},
        "specificity_consistent": {"type": "boolean"},
        "self_contradictions_detected": {"type": "boolean"},
        "contradiction_detail": {"type": "string"},
        "red_flags": {"type": "array", "items": {"type": "string"}},
        "strong_signals": {"type": "array", "items": {"type": "string"}},
        "suggested_followup_questions": {"type": "array", "items": {"type": "string"}},
        "requires_human_review": {"type": "boolean"},
    },
    "required": [
        "overall_signal", "summary", "performs_under_pressure",
        "specificity_consistent", "self_contradictions_detected",
        "contradiction_detail", "red_flags", "strong_signals",
        "suggested_followup_questions", "requires_human_review",
    ],
}


def _gemini_call(prompt: str, schema: dict) -> dict:
    """Shared Gemini call with retry logic."""
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise ExternalServiceError("google-genai is not installed.") from exc

    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise ExternalServiceError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=api_key)
    last_error: Exception | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        raw_text = ""
        try:
            response = client.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=_TEMPERATURE,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            raw_text = (response.text or "").strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise ExternalServiceError(f"LLM returned non-JSON: {raw_text[:200]}") from exc
        except ExternalServiceError:
            raise
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning("Gemini call attempt %d/%d failed: %s", attempt, _MAX_RETRIES, exc)

    raise ExternalServiceError(f"Gemini call failed after {_MAX_RETRIES} attempts.") from last_error


class GeminiThreadEvaluationProvider(IThreadEvaluationProvider):
    """
    Evaluates one complete topic thread using Gemini.

    Triggered when ask_next_question fires (topic is done), NOT per turn.
    Passes the full conversation on that topic so Gemini can see
    how the candidate performed under probing — not just their
    opening answer.
    """

    def evaluate_thread(
        self,
        *,
        seed_topic_text: str,
        expected_topics: list[str],
        conversation: list[dict],
        interview_type: str,
        domain: str,
        difficulty: str,
    ) -> ThreadEvaluationResult:
        expected_topics_block = (
            "\n".join(f"- {t}" for t in expected_topics)
            if expected_topics
            else "- (no specific concepts — evaluate general depth and clarity)"
        )

        conversation_block = "\n".join(
            f"{'INTERVIEWER' if t['speaker'] == 'assistant' else 'CANDIDATE'}: {t['text']}"
            for t in conversation
        )

        candidate_turns = [t for t in conversation if t["speaker"] == "candidate"]

        # Too few turns to meaningfully evaluate.
        if len(candidate_turns) < 2:
            return ThreadEvaluationResult(
                depth_under_pressure=5.0,
                conceptual_accuracy=5.0,
                specificity=5.0,
                recovery=5.0,
                overall_score=5.0,
                verdict="insufficient",
                red_flags=[],
                strong_signals=[],
                suggested_followups=["This topic had too few candidate turns to evaluate — probe it in the next round."],
                requires_human_review=False,
                turn_count=len(conversation),
                candidate_turn_count=len(candidate_turns),
                model_used=_MODEL,
            )

        prompt = _THREAD_PROMPT.format(
            interview_type=interview_type,
            domain=domain,
            difficulty=difficulty,
            seed_topic_text=seed_topic_text,
            expected_topics_block=expected_topics_block,
            conversation_block=conversation_block,
        )

        data = _gemini_call(prompt, _THREAD_SCHEMA)

        return ThreadEvaluationResult(
            depth_under_pressure=float(data["depth_under_pressure"]),
            conceptual_accuracy=float(data["conceptual_accuracy"]),
            specificity=float(data["specificity"]),
            recovery=float(data["recovery"]),
            overall_score=float(data["overall_score"]),
            verdict=data["verdict"],
            red_flags=data.get("red_flags", []),
            strong_signals=data.get("strong_signals", []),
            suggested_followups=data.get("suggested_followups", []),
            requires_human_review=data.get("requires_human_review", False),
            human_review_reason=data.get("human_review_reason", ""),
            turn_count=len(conversation),
            candidate_turn_count=len(candidate_turns),
            model_used=_MODEL,
            raw_response=data,
        )


class GeminiInterviewBriefProvider(IInterviewBriefProvider):
    """
    Generates the post-interview brief from all thread evaluation results.
    Called once after the full interview ends.
    """

    def generate_brief(
        self,
        *,
        interview_type: str,
        domain: str,
        difficulty: str,
        thread_results: list[dict],
    ) -> InterviewBriefResult:
        thread_results_block = "\n\n".join(
            f"Topic {i + 1}: {r.get('seed_topic_text', 'Unknown')}\n"
            f"  Verdict      : {r.get('verdict', 'unknown')}\n"
            f"  Overall score: {r.get('overall_score', 'N/A')}\n"
            f"  Red flags    : {'; '.join(r.get('red_flags', [])) or 'none'}\n"
            f"  Strong signals: {'; '.join(r.get('strong_signals', [])) or 'none'}"
            for i, r in enumerate(thread_results)
        )

        prompt = _BRIEF_PROMPT.format(
            interview_type=interview_type,
            domain=domain,
            difficulty=difficulty,
            thread_results_block=thread_results_block,
        )

        data = _gemini_call(prompt, _BRIEF_SCHEMA)

        return InterviewBriefResult(
            overall_signal=data["overall_signal"],
            summary=data["summary"],
            performs_under_pressure=data["performs_under_pressure"],
            specificity_consistent=data["specificity_consistent"],
            self_contradictions_detected=data["self_contradictions_detected"],
            contradiction_detail=data.get("contradiction_detail", ""),
            red_flags=data.get("red_flags", []),
            strong_signals=data.get("strong_signals", []),
            suggested_followup_questions=data.get("suggested_followup_questions", []),
            requires_human_review=data.get("requires_human_review", False),
            model_used=_MODEL,
            raw_response=data,
        )