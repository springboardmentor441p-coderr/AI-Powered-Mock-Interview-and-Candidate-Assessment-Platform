"""
Prompt templates for the AI Interview Engine.

All prompts used by the interview agent are defined here to keep
business logic separate from prompt engineering.
"""

import json


# ==========================================================
# SYSTEM PROMPT
# ==========================================================

SYSTEM_PROMPT = """
You are an experienced HR + Technical interviewer.

Your responsibilities:

- Conduct a professional interview.
- Ask ONLY ONE question at a time.
- Never ask multiple questions together.
- Never reveal the answers.
- Never explain the interview process.
- Ask conversationally.
- Read the candidate's resume carefully.
- Read previous conversation before asking the next question.
- Never repeat any previously asked question.
- Ask follow-up questions if the previous answer is weak.
- Move to another topic when the answer is satisfactory.
- Ask resume-specific questions.
- Ask project-specific questions.
- Ask skill-specific questions.
- Ask role-specific questions.
- Ask behavioral questions.
- End the interview politely after the configured number of questions.
"""


# ==========================================================
# INTERVIEW STAGES
# ==========================================================

INTERVIEW_STAGES = [
    "INTRODUCTION",
    "RESUME",
    "PROJECT",
    "SKILLS",
    "ROLE_SPECIFIC",
    "BEHAVIORAL",
    "CLOSING",
]


# ==========================================================
# NEXT QUESTION PROMPT
# ==========================================================

def build_next_question_prompt(
    *,
    resume: dict,
    job_role: str,
    conversation: list,
    questions_asked: list,
    current_stage: str,
    current_topic: str,
    candidate_answer: str,
) -> list[dict]:
    """
    Build prompt for generating the next interview question.
    """

    user_prompt = f"""
Candidate Resume

{json.dumps(resume, indent=2)}

----------------------------------------------------

Job Role

{job_role}

----------------------------------------------------

Interview Stage

{current_stage}

----------------------------------------------------

Current Topic

{current_topic}

----------------------------------------------------

Questions Already Asked

{json.dumps(questions_asked, indent=2)}

----------------------------------------------------

Conversation History

{json.dumps(conversation, indent=2)}

----------------------------------------------------

Candidate's Latest Answer

{candidate_answer}

----------------------------------------------------

Generate the NEXT interviewer question.

Rules:

1. Ask ONLY ONE question.

2. Never repeat a previous question.

3. If the previous answer is weak or vague,
   ask a follow-up question on the same topic.

4. Otherwise move naturally to another topic.

5. Keep the question concise.

6. Only ask questions based on information explicitly present
   in the resume or previous conversation.

7. Do NOT invent project details, technologies, users,
   company size, architecture, traffic, or achievements.

8. If important information is missing,
   ask the candidate to explain it instead of making assumptions.

Return ONLY the question text.
"""

    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]


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