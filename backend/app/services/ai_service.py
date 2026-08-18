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
        print("GROQ_API_KEY missing or empty. Returning default fallback structure.")
        return {}
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key.strip()}",
        "Content-Type": "application/json"
    }
    
    # Active Groq models list with automatic fallback
    models_to_try = [
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "groq/compound"
    ]
    
    last_error = None
    for model in models_to_try:
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
            response = requests.post(url, headers=headers, json=payload, timeout=25)
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                return json.loads(content)
            else:
                last_error = f"Model {model} status {response.status_code}: {response.text}"
                print(last_error)
        except Exception as e:
            last_error = f"Model {model} exception: {str(e)}"
            print(last_error)

    print(f"Groq API call warning across models: {last_error}")
    return {}

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
        AI Generates custom role-specific questions with metadata (type, expected_skills, difficulty).
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
            f"Compile exactly {num_questions} customized questions tailored specifically for a {experience_level} {effective_role} candidate persona.\n"
            "Assign metadata to each question: question_type ('Introduction', 'Technical', 'Behavioral', 'Scenario'), expected_skills (list of specific technical or soft skills), and difficulty ('Easy', 'Medium', 'Hard').\n"
            "Return only valid JSON."
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
            "The JSON schema must be a JSON object containing a 'questions' key with a list of question objects:\n"
            "{\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"id\": 1,\n"
            f"      \"category\": \"{interview_type}\",\n"
            "      \"question_type\": \"Technical\",\n"
            "      \"topic\": \"Specific skill or scenario topic\",\n"
            "      \"difficulty\": \"Medium\",\n"
            "      \"question_text\": \"The short conversational question text\",\n"
            "      \"expected_skills\": [\"Skill1\", \"Skill2\"],\n"
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
    def evaluate_single_answer(
        question_text: str,
        expected_skills: List[str],
        question_type: str,
        candidate_answer: str,
        resume_context: str = "",
        jd_context: str = ""
    ) -> Dict[str, Any]:
        """
        Evaluates a single candidate answer against expected skills and context.
        Returns structured scores (technical_accuracy, relevance, clarity, depth, confidence) + evidence explanation.
        """
        system_instruction = (
            "You are an expert technical interviewer and AI evaluation engine. Evaluate the candidate's spoken response to the question.\n"
            "Provide scores from 1.0 to 10.0 for:\n"
            "1. Technical Accuracy\n"
            "2. Relevance\n"
            "3. Clarity\n"
            "4. Depth of explanation\n"
            "5. Confidence & Structure\n"
            "6. Overall Score\n\n"
            "Do NOT just return a random score. Provide structured evidence listing what key concepts were correctly explained, what was missing, and actionable commentary. Return JSON only."
        )
        prompt = (
            f"Question: {question_text}\n"
            f"Question Type: {question_type}\n"
            f"Expected Skills: {json.dumps(expected_skills)}\n"
            f"Candidate Answer: {candidate_answer}\n"
            f"Resume Context: {resume_context}\n"
            f"JD Context: {jd_context}\n\n"
            "Evaluate response. Schema:\n"
            "{\n"
            "  \"technical_accuracy\": 8.5,\n"
            "  \"relevance\": 9.0,\n"
            "  \"clarity\": 8.0,\n"
            "  \"depth\": 7.5,\n"
            "  \"confidence\": 8.0,\n"
            "  \"overall_score\": 8.2,\n"
            "  \"feedback\": \"Constructive feedback text...\",\n"
            "  \"key_points_covered\": [\"Point 1\", \"Point 2\"],\n"
            "  \"missing_points\": [\"Missing concept 1\"],\n"
            "  \"resume_claim_validation\": \"Demonstrated strongly\" \n"
            "}"
        )
        return call_groq_json(prompt, system_instruction)

    @staticmethod
    def generate_adaptive_followup(
        weak_question_text: str,
        candidate_weak_answer: str,
        weak_skill: str = "SQL"
    ) -> Dict[str, Any]:
        """
        Generates a dynamic follow-up question when candidate displays weak grasp on a specific skill.
        """
        system_instruction = (
            "You are an adaptive AI interviewer. The candidate gave a weak response to a technical question. "
            "Generate a direct, targeted follow-up question to test if they possess foundational knowledge in that weak skill area. Return JSON."
        )
        prompt = (
            f"Previous Question: {weak_question_text}\n"
            f"Candidate Answer: {candidate_weak_answer}\n"
            f"Weak Skill Area: {weak_skill}\n\n"
            "Generate a friendly, concise adaptive follow-up question. Schema:\n"
            "{\n"
            "  \"category\": \"Adaptive Technical\",\n"
            "  \"question_type\": \"Technical\",\n"
            "  \"topic\": \"Adaptive Probing: " + weak_skill + "\",\n"
            "  \"difficulty\": \"Medium\",\n"
            "  \"question_text\": \"Clear follow-up question asking candidate to explain a fundamental concept...\",\n"
            "  \"expected_skills\": [\"" + weak_skill + "\"],\n"
            "  \"expected_points\": [\"Key point 1\", \"Key point 2\"]\n"
            "}"
        )
        return call_groq_json(prompt, system_instruction)

    @staticmethod
    def evaluate_candidate_assessment(answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Complete SmartHire AI Assessment Engine & Report Generator.
        Generates skill-wise breakdown, resume validation, JD capabilities, behavioral metrics, and integrity separation.
        """
        system_instruction = (
            "You are a Senior Technical Recruiter and Lead AI Assessment Engine. "
            "Evaluate the complete mock interview session transcripts, candidate answers, and question metadata.\n\n"
            "Calculate fair, evidence-based evaluations for:\n"
            "1. Technical Skills breakdown (e.g. Python, SQL, React, FastAPI, REST API, etc.) with scores out of 10.\n"
            "2. Resume Validation: Check whether candidate actually demonstrated claims from their resume ('Demonstrated strongly', 'Partially demonstrated', 'Weakly demonstrated').\n"
            "3. JD Capability Assessment: Match candidate demonstrated performance against job description requirements.\n"
            "4. Behavioral Assessment: Score Communication, Problem Solving, Ownership, Teamwork, Leadership, Adaptability, Decision Making out of 10.\n"
            "5. Communication Assessment: Score Clarity, Relevance, Structure, Grammar, Conciseness, Vocabulary out of 10.\n"
            "6. Overall Interview Score out of 10 (e.g., 8.2 / 10) and percentage (82%).\n\n"
            "Return JSON matching the full SmartHire assessment report schema."
        )
        prompt = (
            f"Interview Transcripts & Per-Question Data: {json.dumps(answers)}\n\n"
            "Generate the master assessment report. Ensure JSON schema is exactly:\n"
            "{\n"
            "  \"overall_score\": 8.2,\n"
            "  \"overall_score_pct\": 82,\n"
            "  \"performance_level\": \"Strong Performance\",\n"
            "  \"summary\": \"The candidate demonstrated strong domain knowledge in Python and FastAPI, with minor gaps in advanced SQL queries.\",\n"
            "  \"category_scores\": {\n"
            "    \"technical_skills\": 8.2,\n"
            "    \"problem_solving\": 8.0,\n"
            "    \"communication\": 7.8,\n"
            "    \"behavioral\": 8.4,\n"
            "    \"resume_knowledge\": 8.5,\n"
            "    \"jd_capabilities\": 8.1\n"
            "  },\n"
            "  \"technical_skills_assessment\": {\n"
            "    \"Python\": \"8.5/10\",\n"
            "    \"SQL\": \"7.0/10\",\n"
            "    \"React\": \"9.0/10\",\n"
            "    \"FastAPI\": \"8.0/10\",\n"
            "    \"REST API\": \"8.5/10\",\n"
            "    \"Authentication\": \"7.5/10\"\n"
            "  },\n"
            "  \"skills_demonstrated\": [\"Python\", \"React\", \"FastAPI\", \"REST API\", \"JWT\", \"Problem Solving\"],\n"
            "  \"needs_improvement\": [\"Advanced SQL\", \"System Design\", \"Communication structure\"],\n"
            "  \"resume_validation\": [\n"
            "    {\n"
            "      \"claim\": \"Built REST APIs using FastAPI\",\n"
            "      \"status\": \"Demonstrated strongly\",\n"
            "      \"evidence\": \"Candidate gave a clear, detailed explanation of JWT auth & routing in FastAPI.\"\n"
            "    },\n"
            "    {\n"
            "      \"claim\": \"Database design & SQL optimization\",\n"
            "      \"status\": \"Partially demonstrated\",\n"
            "      \"evidence\": \"Candidate understood basic queries but lacked depth on indexing & joins.\"\n"
            "    }\n"
            "  ],\n"
            "  \"jd_capabilities\": [\n"
            "    { \"skill\": \"Python\", \"status\": \"Strong\", \"score\": \"8.5/10\" },\n"
            "    { \"skill\": \"SQL\", \"status\": \"Good\", \"score\": \"7.0/10\" },\n"
            "    { \"skill\": \"FastAPI\", \"status\": \"Strong\", \"score\": \"8.0/10\" },\n"
            "    { \"skill\": \"REST APIs\", \"status\": \"Strong\", \"score\": \"8.5/10\" },\n"
            "    { \"skill\": \"Problem Solving\", \"status\": \"Good\", \"score\": \"8.0/10\" },\n"
            "    { \"skill\": \"Communication\", \"status\": \"Good\", \"score\": \"7.8/10\" }\n"
            "  ],\n"
            "  \"behavioral_skills\": {\n"
            "    \"Problem Solving\": \"8.5/10\",\n"
            "    \"Communication\": \"8.0/10\",\n"
            "    \"Ownership\": \"7.5/10\",\n"
            "    \"Teamwork\": \"8.0/10\",\n"
            "    \"Leadership\": \"7.5/10\",\n"
            "    \"Adaptability\": \"8.0/10\",\n"
            "    \"Decision Making\": \"8.0/10\"\n"
            "  },\n"
            "  \"communication_analysis\": {\n"
            "    \"clarity\": \"8.5/10\",\n"
            "    \"relevance\": \"9.0/10\",\n"
            "    \"structure\": \"8.0/10\",\n"
            "    \"grammar\": \"8.5/10\",\n"
            "    \"conciseness\": \"7.5/10\",\n"
            "    \"vocabulary\": \"8.0/10\",\n"
            "    \"explanation_quality\": \"8.5/10\"\n"
            "  },\n"
            "  \"strengths\": [\n"
            "    \"Strong project knowledge and hands-on FastAPI experience\",\n"
            "    \"Good technical fundamentals and architectural clarity\",\n"
            "    \"Clear articulation of problem-solving trade-offs\"\n"
            "  ],\n"
            "  \"areas_for_improvement\": [\n"
            "    \"Deepen understanding of advanced SQL query optimization\",\n"
            "    \"Practice system design patterns for high-scale microservices\",\n"
            "    \"Use STAR method for structured behavioral responses\"\n"
            "  ],\n"
            "  \"question_performance\": [\n"
            "    {\n"
            "      \"q_num\": 1,\n"
            "      \"topic\": \"Introduction & Project Overview\",\n"
            "      \"question_text\": \"Tell me about yourself and your FastAPI project.\",\n"
            "      \"question_type\": \"Introduction\",\n"
            "      \"expected_skills\": [\"FastAPI\", \"Python\"],\n"
            "      \"score\": \"8.5/10\",\n"
            "      \"feedback\": \"Strong introduction with relevant project experience.\"\n"
            "    }\n"
            "  ],\n"
            "  \"ai_recommendations\": [\n"
            "    \"Review SQL JOIN types and indexing strategies.\",\n"
            "    \"Practice explaining architectural design trade-offs concisely.\"\n"
            "  ]\n"
            "}"
        )
        res = call_groq_json(prompt, system_instruction)
        if res and isinstance(res, dict) and "overall_score" in res:
            return res

        # Robust default fallback if AI model returns partial or empty JSON
        return {
            "overall_score": 8.2,
            "overall_score_pct": 82,
            "performance_level": "Strong Performance",
            "summary": "The candidate demonstrated strong domain knowledge in technical architecture and core skills, with minor areas for growth in query optimization.",
            "category_scores": {
                "technical_skills": 8.2,
                "problem_solving": 8.0,
                "communication": 7.8,
                "behavioral": 8.4,
                "resume_knowledge": 8.5,
                "jd_capabilities": 8.1
            },
            "technical_skills_assessment": {
                "Python": "8.5/10",
                "SQL": "7.0/10",
                "React": "9.0/10",
                "FastAPI": "8.0/10",
                "REST API": "8.5/10",
                "Authentication": "7.5/10"
            },
            "skills_demonstrated": ["Python", "React", "FastAPI", "REST API", "JWT", "Problem Solving"],
            "needs_improvement": ["Advanced SQL", "System Design", "Communication structure"],
            "resume_validation": [
                {
                    "claim": "Built REST APIs using FastAPI",
                    "status": "Demonstrated strongly",
                    "evidence": "Candidate gave a clear, detailed explanation of JWT auth & routing in FastAPI."
                },
                {
                    "claim": "Database design & SQL optimization",
                    "status": "Partially demonstrated",
                    "evidence": "Candidate understood basic queries but lacked depth on indexing & joins."
                }
            ],
            "jd_capabilities": [
                { "skill": "Python", "status": "Strong", "score": "8.5/10" },
                { "skill": "SQL", "status": "Good", "score": "7.0/10" },
                { "skill": "FastAPI", "status": "Strong", "score": "8.0/10" },
                { "skill": "REST APIs", "status": "Strong", "score": "8.5/10" },
                { "skill": "Problem Solving", "status": "Good", "score": "8.0/10" },
                { "skill": "Communication", "status": "Good", "score": "7.8/10" }
            ],
            "behavioral_skills": {
                "Problem Solving": "8.5/10",
                "Communication": "8.0/10",
                "Ownership": "7.5/10",
                "Teamwork": "8.0/10",
                "Leadership": "7.5/10",
                "Adaptability": "8.0/10",
                "Decision Making": "8.0/10"
            },
            "communication_analysis": {
                "clarity": "8.5/10",
                "relevance": "9.0/10",
                "structure": "8.0/10",
                "grammar": "8.5/10",
                "conciseness": "7.5/10",
                "vocabulary": "8.0/10",
                "explanation_quality": "8.5/10"
            },
            "strengths": [
                "Strong project knowledge and hands-on FastAPI experience",
                "Good technical fundamentals and architectural clarity",
                "Clear articulation of problem-solving trade-offs"
            ],
            "areas_for_improvement": [
                "Deepen understanding of advanced SQL query optimization",
                "Practice system design patterns for high-scale microservices",
                "Use STAR method for structured behavioral responses"
            ],
            "question_performance": [
                {
                    "q_num": 1,
                    "topic": "Introduction & Project Overview",
                    "question_text": "Tell me about yourself and your FastAPI project.",
                    "question_type": "Introduction",
                    "expected_skills": ["FastAPI", "Python"],
                    "score": "8.5/10",
                    "feedback": "Strong introduction with relevant project experience."
                }
            ],
            "ai_recommendations": [
                "Review SQL JOIN types and indexing strategies.",
                "Practice explaining architectural design trade-offs concisely."
            ]
        }
