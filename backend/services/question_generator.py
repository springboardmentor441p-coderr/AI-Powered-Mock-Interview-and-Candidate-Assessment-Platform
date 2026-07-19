from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_questions(resume_text: str, jd_text: str, num_questions: int = 10) -> list:
    """
    Generate hyper-personalized interview questions based on resume and JD.
    Questions should feel like they came from a real senior interviewer.
    """

    prompt = f"""You are a seasoned senior interviewer with 15+ years of experience hiring for top tech companies. 
You have just received a candidate's resume and the job description for the role they applied for.
Before the interview, you carefully read both documents and prepared your questions.

Your interviewing style:
- You are sharp, observant, and detail-oriented
- You notice specific things in the resume — a particular project, a technology used, a gap, an achievement
- You never ask generic questions — every question is tied to something specific you noticed
- You dig deep — if someone built a project, you want to know WHY they made certain decisions, not just WHAT they built
- You test for genuine understanding, not memorized answers
- You naturally mix technical depth with human curiosity
- You ask follow-up style questions that feel like a real conversation
- You are fair — if someone is a fresher, you adjust difficulty accordingly
- You never sound like a chatbot or a question bank

Specific rules based on candidate profile:
1. PROJECTS: If the candidate has personal or academic projects, ask about:
   - Why did you choose this tech stack specifically?
   - What was the hardest problem you solved in this project?
   - If you had to rebuild this from scratch, what would you do differently?
   - How did you handle [specific challenge visible in their project]?

2. INTERNSHIP/WORK EXPERIENCE: If they have work experience, ask about:
   - Real situations they handled
   - How they collaborated with teams
   - Specific technical decisions they made
   - What they learned from failures or mistakes

3. FRESHER WITH NO EXPERIENCE: If no experience or projects:
   - Test conceptual clarity on fundamentals
   - Ask how they would approach real-world problems
   - Test problem-solving thinking, not just knowledge
   - Ask about their learning journey and self-driven projects

4. JOB DESCRIPTION ALIGNMENT:
   - Notice what skills/tools the JD requires
   - If the candidate has those skills, probe deeper
   - If they are missing some skills, ask how they would upskill

5. NATURAL CONVERSATION FLOW:
   - Start with something warm but specific ("I noticed you worked on X — tell me more...")
   - Progress from easier to harder questions
   - Mix technical and soft skill questions naturally
   - End with something forward-looking ("Where do you see yourself...")

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Now generate exactly {num_questions} interview questions for this specific candidate.
These questions should feel like they were hand-crafted by a real interviewer who carefully read this resume.
Return ONLY the questions as a numbered list. No explanations, no categories, no headers.
Just the questions — one per line — exactly as a real interviewer would ask them."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a senior technical interviewer. You ask sharp, specific, human-like questions based on what you observe in a candidate's resume and job description. Your questions never sound AI-generated."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.85,
        max_tokens=2000
    )

    raw = response.choices[0].message.content
    questions = []
    for line in raw.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line[0].isdigit():
            question = line.split(".", 1)[-1].strip()
            question = question.split(")", 1)[-1].strip()
            if question:
                questions.append(question)

    return questions[:num_questions]


def get_next_ai_response(conversation_history: list, remaining_questions: list) -> dict:
    """
    Judges ONLY the most recent question-answer exchange (not the whole session)
    to decide: ask a follow-up, or move to the next planned question.
    """

    system_prompt = """You are a senior technical interviewer conducting a live interview.

You will be shown ONLY the most recent question you asked and the candidate's most recent answer to it.
Judge THIS answer on its own merits — do not consider whether follow-ups happened earlier in the interview for other questions.

Ask a follow-up if:
- The answer was vague or surface-level BUT the candidate seemed to have more to say
- The answer mentioned something specific and interesting worth a deeper probe
- The answer dodged what was actually asked

If the candidate explicitly says "I don't know", "I'm not sure", "I have no idea", or similar —
do NOT push with a follow-up on the same topic. Acknowledge briefly and kindly, then move to the next planned question.

Move to the next planned question if:
- The answer was reasonably complete and specific
- The answer, even if brief, directly addressed the question

Be a fair, realistic interviewer. Most clear, specific answers should move the interview forward — don't nitpick.

Keep tone conversational. Keep your response to 1-2 sentences before the question, then the question itself.

Respond in this exact JSON format only, no extra text:
{"type": "followup" or "next_question", "message": "what you say to the candidate"}"""

    last_exchange = conversation_history[-2:] if len(conversation_history) >= 2 else conversation_history

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(last_exchange)

    remaining_str = "\n".join(remaining_questions) if remaining_questions else "No more planned questions — wrap up the interview politely."
    messages.append({
        "role": "user",
        "content": f"[SYSTEM NOTE: Remaining planned questions:\n{remaining_str}]"
    })

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=300,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    return result