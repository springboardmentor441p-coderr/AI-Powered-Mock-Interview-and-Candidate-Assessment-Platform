import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def evaluate_answer(question, answer):

    prompt = f"""
You are an experienced technical interviewer.

Evaluate the candidate's answer.

Question:
{question}

Candidate Answer:
{answer}

Give your response ONLY as valid JSON.

Format:

{{
    "score": 8,
    "feedback": "Short feedback",
    "strengths": [
        "...",
        "..."
    ],
    "improvements": [
        "...",
        "..."
    ],
    "ideal_answer": "Ideal interview answer"
}}

The score must be between 0 and 10.
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    result = response.choices[0].message.content

    print(result)

    result = result.replace("```json", "").replace("```", "").strip()

    start = result.find("{")
    end = result.rfind("}")

    if start == -1 or end == -1:
        raise Exception("Invalid JSON returned by LLM")

    return json.loads(result[start:end + 1])