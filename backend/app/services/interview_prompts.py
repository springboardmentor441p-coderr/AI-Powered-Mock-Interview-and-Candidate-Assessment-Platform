"""
Prompt templates for the AI Interview Engine.

All prompts used by the interview agent are defined here to keep
business logic separate from prompt engineering.
"""

import json


# ==========================================================
# ANSWER EVALUATION PROMPT
# ==========================================================

ANSWER_EVALUATION_SYSTEM_PROMPT = """
You are an interview evaluator.

Evaluate the candidate's answer.

Return ONLY valid JSON.

The JSON format MUST be:

{
  "quality":"good",
  "technical":8,
  "communication":7,
  "confidence":8,
  "problem_solving":7,
  "needs_followup":false,
  "reason":"Short explanation."
}

Rules:

technical: 0-10

communication: 0-10

confidence: 0-10

problem_solving: 0-10

quality must be one of

good

average

weak
"""


def build_answer_evaluation_prompt(
    *,
    question: str,
    answer: str,
) -> list[dict]:
    """
    Build prompt for evaluating a candidate's answer.
    """

    return [
        {
            "role": "system",
            "content": ANSWER_EVALUATION_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": f"""
Question

{question}

--------------------------------------

Candidate Answer

{answer}

--------------------------------------

Evaluate the answer.

Return ONLY valid JSON.
""",
        },
    ]


# ==========================================================
# FINAL FEEDBACK PROMPT
# ==========================================================

FINAL_FEEDBACK_SYSTEM_PROMPT = """
You are an interview panel.

Review the entire interview.

Return ONLY valid JSON.

Use this schema:

{
  "overall_score":85,
  "strengths":[
      "...",
      "..."
  ],
  "weaknesses":[
      "...",
      "..."
  ],
  "communication":"...",
  "technical_knowledge":"...",
  "suggested_improvements":[
      "...",
      "..."
  ]
}
"""


def build_feedback_prompt(
    *,
    resume: dict,
    job_role: str,
    conversation: list,
    scores: dict,
) -> list[dict]:
    """
    Build prompt for generating final interview feedback.
    """

    user_prompt = f"""
Candidate Resume

{json.dumps(resume, indent=2)}

---------------------------------------

Job Role

{job_role}

---------------------------------------

Interview Conversation

{json.dumps(conversation, indent=2)}

---------------------------------------

Interview Scores

{json.dumps(scores, indent=2)}

---------------------------------------

Generate the final interview feedback.

Return ONLY valid JSON.
"""

    return [
        {
            "role": "system",
            "content": FINAL_FEEDBACK_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]
