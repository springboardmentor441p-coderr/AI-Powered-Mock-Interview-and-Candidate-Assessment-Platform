import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def evaluate_interview(transcript):

    prompt = f"""
You are an expert AI Technical Interview Evaluator for SmartHire AI.

Your task is to evaluate the candidate ONLY based on the interview transcript.

=========================
Evaluation Criteria
=========================

1. Technical Knowledge (40%)
2. Communication Skills (20%)
3. Problem Solving Ability (20%)
4. Professionalism & Confidence (20%)

=========================
Interview Completion Rules
=========================

- Determine whether the interview is Completed or Incomplete.
- If the candidate answered only a few questions or disconnected early,
  mark it as "Incomplete".
- Incomplete interviews should receive appropriately lower scores.
- Never recommend a candidate who did not complete the interview.

=========================
Scoring Rules
=========================

IMPORTANT:

ALL SCORES MUST BE BETWEEN 0 AND 100.

DO NOT return scores between 0 and 10.

Examples:

Excellent candidate:
Overall Score = 92

Good candidate:
Overall Score = 81

Average candidate:
Overall Score = 67

Weak candidate:
Overall Score = 42

Very poor candidate:
Overall Score = 18

=========================
Return ONLY Valid JSON
=========================

Use EXACTLY this format.

{{
    "interview_status": "Completed",

    "completion_reason": "Candidate completed the interview successfully.",

    "score": 82,

    "technical_score": 85,

    "communication_score": 80,

    "problem_solving_score": 78,

    "professionalism_score": 84,

    "feedback": "Provide a detailed evaluation discussing technical strengths, communication quality, professionalism, confidence, weaknesses, and areas for improvement. Do NOT mention hiring decision.",

    "recommendation": "Recommended",

    "recommendation_reason": "Briefly explain why the candidate should or should not be selected."
}}

Transcript:

{transcript}
"""

    try:

        response = client.chat.completions.create(

            model="llama-3.1-8b-instant",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.2

        )

        raw_response = response.choices[0].message.content

        print("\n========== RAW GROQ RESPONSE ==========")
        print(raw_response)

        json_match = re.search(r"\{[\s\S]*\}", raw_response)

        if not json_match:
            raise Exception("JSON object not found")

        result = json.loads(json_match.group())

        # Safety checks
        result["score"] = max(0, min(100, int(result.get("score", 0))))
        result["technical_score"] = max(
            0,
            min(100, int(result.get("technical_score", 0)))
        )
        result["communication_score"] = max(
            0,
            min(100, int(result.get("communication_score", 0)))
        )
        result["problem_solving_score"] = max(
            0,
            min(100, int(result.get("problem_solving_score", 0)))
        )
        result["professionalism_score"] = max(
            0,
            min(100, int(result.get("professionalism_score", 0)))
        )

        print("\n========== PARSED RESULT ==========")
        print(result)

        return result

    except Exception as e:

        print("EVALUATION ERROR:", e)

        return {

            "interview_status": "Incomplete",

            "completion_reason": "Evaluation failed",

            "score": 0,

            "technical_score": 0,

            "communication_score": 0,

            "problem_solving_score": 0,

            "professionalism_score": 0,

            "feedback": "Unable to evaluate interview.",

            "recommendation": "Not Recommended",

            "recommendation_reason": "Evaluation failed."

        }