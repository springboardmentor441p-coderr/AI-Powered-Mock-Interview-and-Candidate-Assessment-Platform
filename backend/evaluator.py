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
You are an AI interview evaluator.

Evaluate the candidate based on the interview transcript below.

Transcript:
{transcript}

Analyze:
- Technical knowledge
- Communication skills
- Problem-solving ability
- Professionalism

Return ONLY valid JSON.
Do not add any extra text, recommendation, or explanation outside JSON.

Use this exact format:

{{
    "score": number,
    "technical_score": number,
    "communication_score": number,
    "problem_solving_score": number,
    "professionalism_score": number,
    "feedback": "short feedback about candidate performance"
}}
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

        print("========== RAW GROQ RESPONSE ==========")
        print(raw_response)


        # Extract only JSON part
        # Extract only the first JSON object
        json_match = re.search(
            r'\{[\s\S]*?\}',
            raw_response)


        if json_match:

            json_data = json_match.group()

            result = json.loads(json_data)

            print("========== PARSED RESULT ==========")
            print(result)

            return result


        else:

            raise Exception("JSON object not found")


    except Exception as e:

        print("JSON PARSE ERROR:", e)

        return {
            "score": 0,
            "technical_score": 0,
            "communication_score": 0,
            "problem_solving_score": 0,
            "professionalism_score": 0,
            "feedback": "Failed to parse AI evaluation."
        }