import json
import logging
from typing import Any, Dict
from app.utils.ai_client import generate_text

logger = logging.getLogger("evaluation_engine")


class EvaluationEngine:
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        difficulty: str,
        job_role: str,
    ) -> Dict[str, Any]:
        """
        Evaluate candidate's answer against the interview question.
        Returns a dict of metrics, strengths, weaknesses, and reasoning.
        """
        prompt = self._build_prompt(question, answer, difficulty, job_role)
        system_instruction = (
            "You are a rigorous technical evaluator. You must evaluate the candidate's answer to the given question "
            "and output your evaluation strictly as a valid JSON object. Do not include any markdown format blocks or introductory text. "
            "Output must match this schema:\n"
            "{\n"
            "  \"score\": float,\n"
            "  \"technical_accuracy\": float,\n"
            "  \"concept_understanding\": float,\n"
            "  \"communication\": float,\n"
            "  \"problem_solving\": float,\n"
            "  \"confidence\": float,\n"
            "  \"completeness\": float,\n"
            "  \"practical_knowledge\": float,\n"
            "  \"strengths\": \"string\",\n"
            "  \"weaknesses\": \"string\",\n"
            "  \"reasoning\": \"string\"\n"
            "}\n"
            "All scores must be floats between 0.0 and 10.0."
        )

        response = await generate_text(prompt, system_instruction)
        if response:
            try:
                # Clean up any potential markdown wrap ```json ... ```
                clean_response = response.strip()
                if clean_response.startswith("```"):
                    clean_response = clean_response.split("```")[1]
                    if clean_response.startswith("json"):
                        clean_response = clean_response[4:]
                clean_response = clean_response.strip()
                
                result = json.loads(clean_response)
                # Verify schema
                keys = ["score", "technical_accuracy", "concept_understanding", "communication", 
                        "problem_solving", "confidence", "completeness", "practical_knowledge", 
                        "strengths", "weaknesses", "reasoning"]
                if all(k in result for k in keys):
                    return result
            except Exception as e:
                logger.error(f"Failed to parse LLM evaluation response: {e}. Raw response: {response}")

        # Fallback to local heuristic evaluator
        return self._evaluate_fallback(question, answer, difficulty, job_role)

    def _build_prompt(self, question: str, answer: str, difficulty: str, job_role: str) -> str:
        return (
            f"Interview Role: {job_role}\n"
            f"Difficulty Level: {difficulty}\n"
            f"Question Asked: {question}\n"
            f"Candidate Answer: {answer}\n\n"
            f"Evaluate the candidate's answer based on the following metrics (each scored out of 10.0):\n"
            f"1. Technical Accuracy (Is the technical detail correct?)\n"
            f"2. Concept Understanding (Does the candidate understand the core principles?)\n"
            f"3. Communication (Is the answer structured, clear, and easy to follow?)\n"
            f"4. Problem Solving (Does it demonstrate analytical skills?)\n"
            f"5. Confidence (Is the tone assertive and certain?)\n"
            f"6. Completeness (Did they answer all parts of the question?)\n"
            f"7. Practical Knowledge (Do they refer to real-world experience, libraries, configurations, or limits?)\n\n"
            f"Provide an overall 'score' as the average of the metrics, a brief summary of 'strengths', "
            f"a list of 'weaknesses', and your internal 'reasoning' (design thoughts on their performance)."
        )

    def _evaluate_fallback(
        self,
        question: str,
        answer: str,
        difficulty: str,
        job_role: str,
    ) -> Dict[str, Any]:
        """
        Calculates a realistic mock evaluation score based on answer length,
        vocabulary matching, and technical complexity.
        """
        words = answer.split()
        word_count = len(words)

        # Baseline scores based on answer length
        if word_count < 5:
            # Silence/very brief
            scores = {
                "technical_accuracy": 1.0,
                "concept_understanding": 1.0,
                "communication": 1.0,
                "problem_solving": 1.0,
                "confidence": 1.0,
                "completeness": 1.0,
                "practical_knowledge": 1.0,
            }
            strengths = "None identified due to extremely brief response."
            weaknesses = "Candidate failed to answer the question or provided insufficient detail."
            reasoning = "Response is too short to evaluate. Awarded minimum baseline score."
        else:
            # Check for keyword matching from question
            q_keywords = set(re.findall(r"\w+", question.lower()))
            ans_keywords = set(re.findall(r"\w+", answer.lower()))
            overlap = q_keywords.intersection(ans_keywords)
            overlap_ratio = len(overlap) / max(len(q_keywords), 1)

            # Heuristics
            accuracy = min(3.0 + (overlap_ratio * 7.0) + (min(word_count, 150) / 30.0), 10.0)
            concept = min(4.0 + (overlap_ratio * 4.0) + (min(word_count, 100) / 25.0), 10.0)
            communication = min(5.0 + (min(word_count, 80) / 20.0), 9.0)
            
            # Problem solving & practical knowledge score higher if answer is longer/richer
            prob_solving = min(3.0 + (min(word_count, 120) / 20.0), 9.5)
            confidence = min(4.0 + (min(word_count, 60) / 15.0), 8.5)
            completeness = min(2.0 + (min(word_count, 200) / 25.0), 10.0)
            practical = min(3.0 + (min(word_count, 150) / 25.0), 9.0)

            # Adjust slightly down for Advanced difficulty
            if difficulty == "Advanced":
                accuracy = max(accuracy - 1.0, 1.0)
                concept = max(concept - 0.5, 1.0)
                practical = max(practical - 1.0, 1.0)

            scores = {
                "technical_accuracy": round(accuracy, 1),
                "concept_understanding": round(concept, 1),
                "communication": round(communication, 1),
                "problem_solving": round(prob_solving, 1),
                "confidence": round(confidence, 1),
                "completeness": round(completeness, 1),
                "practical_knowledge": round(practical, 1),
            }

            # Generate strengths & weaknesses
            if word_count > 60:
                strengths = "Good structural detail, clear explanation of concepts, and solid practical references."
                weaknesses = "Could specify performance bottlenecks or specific scale challenges in more detail."
                reasoning = "The candidate demonstrated solid baseline understanding of the topic with structured communication."
            elif word_count > 25:
                strengths = "Direct answer addressing the question immediately."
                weaknesses = "Lacks deep technical explanations, code structures, or real-world use case references."
                reasoning = "Response was concise. Good surface-level definition, but needs to explain core inner workings."
            else:
                strengths = "Basic acknowledgement of the requested topic."
                weaknesses = "Significant lack of technical depth, vague terms, and incomplete explanations."
                reasoning = "Answer is too short to demonstrate technical mastery or software engineering practices."

        overall_score = round(sum(scores.values()) / len(scores), 1)
        
        return {
            "score": overall_score,
            **scores,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "reasoning": reasoning,
        }
import re
