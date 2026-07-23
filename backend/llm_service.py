import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_interview_questions(resume_text):

    prompt = f"""
You are an expert technical interviewer.

Analyze the following candidate resume.

Generate EXACTLY 10 interview questions.

Requirements:
- 5 Technical questions
- 2 Project-related questions
- 2 Behavioral questions
- 1 HR question

Return ONLY valid JSON.

Example:

{{
    "questions": [
        {{
            "category": "Technical",
            "question": "Explain OOP concepts in Python."
        }},
        {{
            "category": "HR",
            "question": "Tell me about yourself."
        }}
    ]
}}

Resume:

{resume_text}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7
    )

    result = response.choices[0].message.content

    print("\n========== RAW RESPONSE ==========\n")
    print(result)
    print("\n==================================\n")

    # Remove markdown code blocks
    result = result.replace("```json", "").replace("```", "").strip()

    # Extract JSON even if extra text exists
    start = result.find("{")
    end = result.rfind("}")

    if start == -1 or end == -1:
        raise Exception("No JSON found in LLM response.")

    json_text = result[start:end + 1]

    print("\n========== CLEAN JSON ==========\n")
    print(json_text)
    print("\n================================\n")

    return json.loads(json_text)