import os
import json
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

def call_groq_json(prompt: str, system_instruction: str = "", temperature: float = 0.7) -> Dict[str, Any]:
    key = os.getenv("GROQ_API_KEY")
    if not key or not key.strip():
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is missing. Please configure it in your backend/.env file."
        )
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    # Self-healing fallback list: Llama-3.3-70B primary → Llama-3.1-8B fallback
    models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    
    import time

    last_error = None
    for model in models_to_try:
        max_retries = 2
        for attempt in range(max_retries):
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction or "Output valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": temperature,
                "max_tokens": 4096
            }
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    return json.loads(content)
                else:
                    print(f"Model {model} returned status {response.status_code}: {response.text}")
                    last_error = response.text
                    break
            except Exception as e:
                print(f"Model {model} execution error: {str(e)}")
                last_error = str(e)
                break

    raise HTTPException(
        status_code=500,
        detail=f"Groq API Error across models: {last_error}"
    )

class AIService:
    @staticmethod
    def extract_resume_info(raw_text: str) -> Dict[str, Any]:
        """
        AI Resume Analysis & Skill Extraction - Powered by Qwen3-32B via Groq.
        """
        system_instruction = (
            "You are an expert ATS parser. Parse the provided resume text and extract "
            "the candidate's name, target role (job title), technical skills, projects, experience summary, "
            "education summary, and certifications. Return only a valid JSON object."
        )
        prompt = (
            f"Resume Text:\n{raw_text}\n\n"
            "Extract and return the profile details. Ensure the JSON schema is exactly:\n"
            "{\n"
            "  \"name\": \"Full Name (or 'Candidate' if not found)\",\n"
            "  \"target_role\": \"Candidate target role or primary job title (e.g. Software Engineer, React Developer)\",\n"
            "  \"skills\": [\"Skill1\", \"Skill2\", ...],\n"
            "  \"projects\": [\n"
            "    {\n"
            "      \"title\": \"Project Title\",\n"
            "      \"tech\": [\"Tech1\", \"Tech2\"],\n"
            "      \"description\": \"Brief description\"\n"
            "    }\n"
            "  ],\n"
            "  \"experience\": \"Brief summary of candidate experience\",\n"
            "  \"education\": \"Brief summary of candidate education\",\n"
            "  \"certifications\": [\"Cert1\", \"Cert2\"]\n"
            "}"
        )
        return call_groq_json(prompt, system_instruction)

    @staticmethod
    def extract_jd_info(raw_text: str) -> Dict[str, Any]:
        """
        AI Understands JD - Extracts required skills, responsibilities, experience level, topics.
        """
        system_instruction = (
            "You are an expert technical recruiter. Parse the provided job description text and extract "
            "required skills, responsibilities, experience level, technical topics, and behavioral topics. "
            "Return only a valid JSON object."
        )
        prompt = (
            f"Job Description Text:\n{raw_text}\n\n"
            "Extract details. The JSON schema must be exactly:\n"
            "{\n"
            "  \"required_skills\": [\"Skill1\", \"Skill2\", ...],\n"
            "  \"responsibilities\": [\"Resp1\", \"Resp2\", ...],\n"
            "  \"experience_level\": \"Job seniority level\",\n"
            "  \"technical_topics\": [\"Topic1\", \"Topic2\", ...],\n"
            "  \"behavioral_topics\": [\"Topic1\", \"Topic2\", ...]\n"
            "}"
        )
        return call_groq_json(prompt, system_instruction)


    @staticmethod
    def generate_candidate_interview(
        resume_info: Dict[str, Any], 
        jd_info: Dict[str, Any],
        interview_type: str = "Technical",
        experience_level: str = "Mid-Level",
        num_questions: int = 5,
        target_role: str = "Software Engineer"
    ) -> List[Dict[str, Any]]:
        """
        AI Generates custom role-specific questions matching candidate persona and target_role.
        """
        effective_role = target_role or jd_info.get("title") or "Software Engineer"
        has_jd_content = bool(jd_info and (jd_info.get("raw_text") or jd_info.get("required_skills") or jd_info.get("responsibilities")))

        if has_jd_content:
            synthesis_rule = (
                "The user has provided BOTH a Resume AND a Job Description. "
                "You MUST generate interview questions that directly evaluate how the candidate's Resume skills, past experience, and projects match the required skills, key responsibilities, and technical topics of the Job Description."
            )
        else:
            synthesis_rule = (
                "The user has provided a Resume. "
                "You MUST generate interview questions tailored specifically to the candidate's Resume skills, technical background, past projects, and experience."
            )

        system_instruction = (
            f"You are a Senior Lead Interviewer conducting a professional {interview_type} mock interview for the role: '{effective_role}'.\n"
            f"{synthesis_rule}\n"
            f"Compile exactly {num_questions} customized, scenario-centric questions tailored specifically for a {experience_level} {effective_role} candidate persona.\n"
            f"IMPORTANT: Focus 100% on core {effective_role} domain concepts, candidate skills, and responsibilities.\n"
            "Return only valid JSON. Keep the question text concise (max 2 sentences) and limit expected points to 2 items per question."
        )
        import time
        import random
        seed = random.randint(10000, 99999)
        prompt = (
            f"Random Session Seed: {time.time()}_{seed}\n"
            f"Target Role: {effective_role}\n"
            f"Experience Level: {experience_level}\n"
            f"Candidate Resume Info: {json.dumps(resume_info)}\n"
            f"Job Description Info: {json.dumps(jd_info)}\n\n"
            f"Generate exactly {num_questions} fresh, unique, varied questions tailored specifically for a {experience_level} {effective_role} candidate persona. "
            "Ensure the questions vary across technical concepts, real-world scenarios, and problem-solving trade-offs. "
            "Keep the question_text clear, short, and conversational. Limit expected_points to a maximum of 2 key bullet points per question. "
            "The JSON schema must be a JSON object containing a 'questions' key with a list of question objects:\n"
            "{\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"id\": 1,\n"
            f"      \"category\": \"{interview_type}\",\n"
            "      \"topic\": \"Specific skill or scenario topic\",\n"
            "      \"question_text\": \"The short conversational question text\",\n"
            "      \"expected_points\": [\"key point 1\", \"key point 2\"]\n"
            "    }\n"
            "  ]\n"
            "}"
        )
        res = call_groq_json(prompt, system_instruction, temperature=0.85)
        if isinstance(res, dict) and "questions" in res:
            return res["questions"]
        elif isinstance(res, list):
            return res
        elif isinstance(res, dict) and "data" in res:
            return res["data"]
        raise HTTPException(status_code=500, detail="Groq returned invalid JSON format for interview questions.")

    @staticmethod
    def evaluate_candidate_assessment(answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Assessment Engine & Final Report Generator.
        Evaluates Technical Accuracy, Communication, Problem Solving, Behavioral.
        Performs Resume Validation & JD Skill Coverage.
        """
        system_instruction = (
            "You are a Lead Tech Recruiter and AI Assessment Engine. Provide detailed, fair, constructive, and highly actionable feedback on the candidate's mock interview.\n\n"
            "Analyze candidate performance using four standard evaluation parameters:\n"
            "1. Communication Score (30% weight) - speech clarity, articulation, structure, filler word usage, and responsiveness.\n"
            "2. Confidence Score (25% weight) - engagement, poise, delivery, hesitation, and directness.\n"
            "3. Technical Relevance Score (30% weight) - accuracy, domain depth, problem solving, architectural trade-offs, and keypoint coverage.\n"
            "4. Professionalism Score (15% weight) - structure, time management, interview etiquette, and conciseness.\n\n"
            "Calculate Overall Score using:\n"
            "Overall Score = Communication * 30% + Confidence * 25% + Technical Relevance * 30% + Professionalism * 15%\n\n"
            "Rating Rubric:\n"
            "90-100: Excellent (Outstanding accuracy & communication)\n"
            "75-89: Good (Strong grasp with minor gaps)\n"
            "60-74: Average (Satisfactory, needs more depth)\n"
            "40-59: Needs Improvement (Noticeable technical or clarity gaps)\n"
            "Below 40: Poor (Insufficient responses)\n\n"
            "For each question, provide 2-3 sentences of specific, constructive commentary highlighting what the candidate did well and what specific key points or technical concepts were missing. Provide 3+ key strengths, 3+ areas for improvement, and 3+ actionable practice recommendations. Return only JSON."
        )
        prompt = (
            f"Interview Transcripts & Expected Keypoints: {json.dumps(answers)}\n\n"
            "Generate a detailed, constructive feedback report. The JSON schema must be exactly:\n"
            "{\n"
            "  \"communication_score\": 90,\n"
            "  \"confidence_score\": 86,\n"
            "  \"technical_score\": 89,\n"
            "  \"professionalism_score\": 88,\n"
            "  \"overall_score_pct\": 88,\n"
            "  \"performance_level\": \"Excellent\",\n"
            "  \"summary\": \"Executive summary of interview performance...\",\n"
            "  \"technical_skills\": {\n"
            "    \"Core Architecture\": \"8/10\",\n"
            "    \"Problem Solving\": \"8/10\",\n"
            "    \"Domain Expertise\": \"8/10\"\n"
            "  },\n"
            "  \"behavioral_skills\": {\n"
            "    \"Leadership\": \"8/10\",\n"
            "    \"Communication\": \"8/10\",\n"
            "    \"Confidence\": \"8/10\"\n"
            "  },\n"
            "  \"resume_validation\": [\n"
            "    {\n"
            "      \"resume_skill\": \"Skill Name\",\n"
            "      \"status\": \"Verified\",\n"
            "      \"details\": \"Commentary matching candidate answers to resume claims\"\n"
            "    }\n"
            "  ],\n"
            "  \"jd_coverage\": [\n"
            "    {\n"
            "      \"skill\": \"Required Job Skill\",\n"
            "      \"score\": \"8/10\",\n"
            "      \"status\": \"Strong\"\n"
            "    }\n"
            "  ],\n"
            "  \"strengths\": [\"Strength 1 with details\", \"Strength 2 with details\", \"Strength 3 with details\"],\n"
            "  \"areas_for_improvement\": [\"Area 1 with advice\", \"Area 2 with advice\", \"Area 3 with advice\"],\n"
            "  \"question_performance\": [\n"
            "    {\n"
            "      \"q_num\": 1,\n"
            "      \"topic\": \"Topic Name\",\n"
            "      \"score\": \"8/10\",\n"
            "      \"feedback\": \"Constructive feedback explaining what was good and what key points were missing.\"\n"
            "    }\n"
            "  ],\n"
            "  \"ai_recommendations\": [\"Recommendation 1\", \"Recommendation 2\", \"Recommendation 3\"]\n"
            "}"
        )
        return call_groq_json(prompt, system_instruction)
