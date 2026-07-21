import json
import re
import random
import os
from typing import List, Dict, Any, Optional

# Helper to detect if a candidate explicitly says they don't know or pass on a topic
def is_dont_know_answer(text: str) -> bool:
    if not text:
        return False
    clean = re.sub(r'[^\w\s]', '', text.lower()).strip()
    dont_know_patterns = [
        r"\bdont know\b", r"\bdo not know\b", r"\bno idea\b",
        r"\bnot sure\b", r"\bnot familiar\b", r"\bhavent used\b", r"\bhave not used\b",
        r"\bhavent worked\b", r"\bhave not worked\b", r"\bno experience\b",
        r"\bpass\b", r"\bskip\b", r"\bnever used\b", r"\bcant recall\b", r"\bcannot recall\b",
        r"\bidk\b", r"\bdunno\b", r"\bnot aware\b", r"\bno knowledge\b", r"\bno background\b"
    ]
    for pattern in dont_know_patterns:
        if re.search(pattern, clean):
            return True
    return False

# Helper to extract key terms from Resume and Job Description for fallback dynamic generation
def extract_key_context(resume_text: Optional[str], job_description: Optional[str]) -> Dict[str, Any]:
    resume = resume_text or ""
    jd = job_description or ""
    
    # Common tech/skills pool to search in text
    tech_pool = [
        "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "HTML", "CSS", "Tailwind",
        "Node.js", "Express", "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MySQL", "SQLite",
        "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub",
        "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Data Analysis",
        "Microservices", "REST API", "GraphQL", "System Design", "Agile", "CI/CD"
    ]
    
    found_resume_skills = [s for s in tech_pool if re.search(r'\b' + re.escape(s) + r'\b', resume, re.IGNORECASE)]
    found_jd_skills = [s for s in tech_pool if re.search(r'\b' + re.escape(s) + r'\b', jd, re.IGNORECASE)]
    
    # Extract lines/duties from JD
    jd_lines = [line.strip() for line in jd.split('\n') if len(line.strip()) > 15]
    jd_summary = random.choice(jd_lines) if jd_lines else "the position's core requirements"
    
    # Extract company or role from resume
    companies = re.findall(r'([A-Za-z0-9\s,\.\-&]+)\s+at\s+([A-Za-z0-9\s,\.\-&]+)', resume)
    company_name = companies[0][1].strip() if companies else "your past engineering projects"
    
    return {
        "resume_skills": found_resume_skills or ["software architecture", "problem solving"],
        "jd_skills": found_jd_skills or ["scalable development", "system performance"],
        "jd_summary": jd_summary,
        "company_name": company_name
    }


class AIService:
    @staticmethod
    def get_api_keys(api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Optional[str]]:
        gemini_key = (api_keys.get("gemini_api_key") if api_keys else None) or os.environ.get("GEMINI_API_KEY")
        openai_key = (api_keys.get("openai_api_key") if api_keys else None) or os.environ.get("OPENAI_API_KEY")
        return {"gemini_api_key": gemini_key, "openai_api_key": openai_key}

    @staticmethod
    def parse_resume(resume_text: str, api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Parses resume text. Uses real LLM if API Key is configured, otherwise fallback to smart regex analysis.
        """
        keys = AIService.get_api_keys(api_keys)
        gemini_key = keys["gemini_api_key"]
        openai_key = keys["openai_api_key"]
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                prompt = f"""
                You are an expert ATS (Applicant Tracking System) parser. Analyze the following resume text and extract the details as structured JSON.
                Return ONLY a JSON object with this exact structure:
                {{
                    "parsed_skills": ["skill1", "skill2", ...],
                    "parsed_experience": [
                        {{"company": "Company Name", "role": "Role Title", "duration": "Duration (e.g. 2021-2023)", "description": "Key accomplishments"}}
                    ],
                    "education": [
                        {{"institution": "University/School", "degree": "Degree (e.g. B.S. CS)", "year": "Graduation year"}}
                    ],
                    "summary": "A 2-3 sentence overview of the candidate's professional profile."
                }}
                
                Resume Text:
                {resume_text}
                """
                response = model.generate_content(prompt)
                # Clean response text to ensure JSON parsing
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                return json.loads(response_text)
            except Exception as e:
                print(f"Gemini resume parsing failed: {e}. Falling back to mock parsing.")
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                prompt = f"Extract skills, experience, education, and professional summary from this resume in JSON format:\n\n{resume_text}"
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional resume parser. Return only JSON output."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI resume parsing failed: {e}. Falling back to mock parsing.")

        # Fallback Mock Parser using Regex & Keywords
        skills_pool = [
            "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "HTML", "CSS", "Tailwind",
            "Node.js", "Express", "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MySQL", "SQLite",
            "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub",
            "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Data Analysis",
            "Product Roadmap", "KPIs", "User Stories", "Agile", "Scrum", "Jira", "Framer Motion", "CI/CD"
        ]
        
        extracted_skills = []
        for skill in skills_pool:
            if re.search(r'\b' + re.escape(skill) + r'\b', resume_text, re.IGNORECASE):
                extracted_skills.append(skill)
                
        # Default skills if none found
        if not extracted_skills:
            extracted_skills = ["Communication", "Problem Solving", "Teamwork", "Adaptability"]

        # Experience extraction
        experience = []
        # Look for potential job paragraphs (simple heuristics)
        jobs = re.findall(r'([A-Za-z0-9\s,\.\-&]+)\s+at\s+([A-Za-z0-9\s,\.\-&]+)', resume_text)
        for job in jobs[:3]:
            experience.append({
                "role": job[0].strip(),
                "company": job[1].strip(),
                "duration": "2022 - Present",
                "description": "Led development teams and managed core system deliverables."
            })
            
        if not experience:
            experience = [
                {"role": "Software Developer Intern", "company": "Tech Solutions Inc.", "duration": "2023 - 2024", "description": "Developed web applications and worked on API integrations using React and Python."},
                {"role": "Junior Developer", "company": "Innovate Lab", "duration": "2024 - Present", "description": "Created interactive components and dashboard portals, optimizing load times by 20%."}
            ]

        # Education extraction
        education = []
        edu_matches = re.findall(r'(Bachelor|Master|B\.S\.|M\.S\.|Degree|BTech|BE|B\.Tech)\s+of\s+([A-Za-z\s]+)', resume_text, re.IGNORECASE)
        for edu in edu_matches[:2]:
            education.append({
                "institution": "University / Institute",
                "degree": f"{edu[0]} of {edu[1].strip()}",
                "year": "2024"
            })
            
        if not education:
            education = [
                {"institution": "State Technical University", "degree": "Bachelor of Computer Science & Engineering", "year": "2024"}
            ]

        # Summary generation
        summary = f"A driven and goal-oriented professional with technical competence in {', '.join(extracted_skills[:4])}. Experienced in delivering robust solutions and collaborating in agile teams to drive technical execution."

        return {
            "parsed_skills": extracted_skills,
            "parsed_experience": experience,
            "education": education,
            "summary": summary
        }

    @staticmethod
    def generate_questions(
        domain: str,
        difficulty: str,
        parsed_skills: List[str],
        resume_text: Optional[str] = None,
        job_description: Optional[str] = None,
        api_keys: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, str]]:
        """
        Generates 5 personalized questions phrased strictly around Candidate Resume and Job Description.
        """
        keys = AIService.get_api_keys(api_keys)
        gemini_key = keys["gemini_api_key"]
        openai_key = keys["openai_api_key"]
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                skills_str = ", ".join(parsed_skills) if parsed_skills else "General technical skills"
                prompt = f"""
                You are an expert AI interviewer. Generate exactly 5 interview questions for a candidate applying in the '{domain}' domain with '{difficulty}' difficulty.
                
                Mandatory Context:
                Job Description:
                {job_description or "General position requirements"}

                Candidate Resume / Profile:
                {resume_text or f"Skills: {skills_str}"}

                CRITICAL INSTRUCTIONS:
                - Do NOT use generic static questions. Every question MUST directly reference specific skills, past projects, past roles, or experience from the Candidate Resume and match them against requirements from the Job Description.
                - Phrase each question clearly around the candidate's specific background and the target job duties.

                Return a JSON array of exactly 5 elements, each element having this structure:
                {{
                    "text": "The interview question text referencing candidate resume details & JD requirements.",
                    "category": "One of: 'technical', 'hr', 'behavioral', 'aptitude'"
                }}
                Ensure there is at least:
                - 2 technical questions
                - 1 behavioral question
                - 1 HR question
                - 1 aptitude/brainteaser question
                Return ONLY valid JSON output.
                """
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                return json.loads(response_text)
            except Exception as e:
                print(f"Gemini question generation failed: {e}. Using dynamic context fallback.")
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                user_msg = f"Generate 5 interview questions specifically phrased around the candidate's Resume and Job Description for domain: {domain}, difficulty: {difficulty}.\nJob Description: {job_description}\nCandidate Resume: {resume_text}"
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional AI interviewer that returns a JSON list of questions phrased around the candidate's resume and job description."},
                        {"role": "user", "content": user_msg}
                    ],
                    response_format={"type": "json_object"}
                )
                data = json.loads(response.choices[0].message.content)
                if isinstance(data, dict):
                    for k, v in data.items():
                        if isinstance(v, list) and len(v) == 5:
                            return v
                return data
            except Exception as e:
                print(f"OpenAI question generation failed: {e}. Using dynamic context fallback.")

        # Dynamic Fallback Question Generator (No static questions, randomized from context)
        ctx = extract_key_context(resume_text, job_description)
        r_skills = ctx["resume_skills"]
        jd_skills = ctx["jd_skills"]
        
        r_skill1 = random.choice(r_skills) if r_skills else "software architecture"
        r_skill2 = random.choice(r_skills) if len(r_skills) > 1 else "data processing"
        jd_skill = random.choice(jd_skills) if jd_skills else "system performance"
        company = ctx["company_name"]

        dynamic_qs = [
            {
                "text": f"Your resume highlights experience with {r_skill1}, while the job description emphasizes {jd_skill}. How have you applied {r_skill1} in your work at {company} to meet similar requirements?",
                "category": "technical"
            },
            {
                "text": f"Considering the requirement for {jd_skill} in this role, can you walk me through an architecture or project where you implemented {r_skill2} under tight constraints?",
                "category": "technical"
            },
            {
                "text": f"Looking at your background at {company}, describe a situation where you had a disagreement with your team over technical implementation decisions for {r_skill1}. How did you resolve it?",
                "category": "behavioral"
            },
            {
                "text": f"Given the responsibilities outlined in the job description ({ctx['jd_summary'][:80]}...) and your skills in {r_skill1}, why do you feel this position aligns with your career goals?",
                "category": "hr"
            },
            {
                "text": f"Suppose a service in production handling {jd_skill} suddenly experiences a 5x spike in latency. Based on your hands-on experience with {r_skill1}, how would you systematically diagnose and resolve the bottleneck?",
                "category": "aptitude"
            }
        ]
        random.shuffle(dynamic_qs)
        return dynamic_qs

    @staticmethod
    def evaluate_answer(question: str, answer: str, api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Evaluates a single answer. Returns score (out of 100), feedback_text, and is_satisfactory.
        """
        if is_dont_know_answer(answer):
            return {
                "score": 30.0,
                "is_satisfactory": False,
                "is_dont_know": True,
                "feedback_text": "Candidate indicated they are unfamiliar with or passing on this question. Moving to next topic."
            }

        keys = AIService.get_api_keys(api_keys)
        gemini_key = keys["gemini_api_key"]
        openai_key = keys["openai_api_key"]
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                prompt = f"""
                You are a senior technical interviewer. Evaluate the candidate's response to the question.
                
                Question: {question}
                Candidate's Answer: {answer}
                
                Evaluate based on technical accuracy, completeness, depth, and clarity.
                Determine whether the answer is satisfactory ("up to marks").
                Return ONLY a JSON object with this exact structure:
                {{
                    "score": 85, // Integer between 0 and 100
                    "is_satisfactory": true, // boolean: false if answer is vague, incomplete, or below standard (score < 60)
                    "feedback_text": "Constructive critique highlighting what was good and what key details were missing."
                }}
                """
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                res = json.loads(response_text)
                if "is_satisfactory" not in res:
                    res["is_satisfactory"] = res.get("score", 70) >= 60
                return res
            except Exception as e:
                print(f"Gemini answer evaluation failed: {e}. Using mock analyzer.")
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional technical recruiter. Evaluate the answer and return a JSON object containing score (0-100), is_satisfactory (boolean), and feedback_text."},
                        {"role": "user", "content": f"Question: {question}\nAnswer: {answer}"}
                    ],
                    response_format={"type": "json_object"}
                )
                res = json.loads(response.choices[0].message.content)
                if "is_satisfactory" not in res:
                    res["is_satisfactory"] = res.get("score", 70) >= 60
                return res
            except Exception as e:
                print(f"OpenAI answer evaluation failed: {e}. Using mock analyzer.")

        # Fallback scoring based on word count & completeness
        word_count = len(answer.split())
        
        if word_count < 15:
            score = float(random.randint(25, 45))
            is_satisfactory = False
            feedback_text = "The response was extremely brief and incomplete. Key technical details and explanations were missing."
        elif word_count < 30:
            score = float(random.randint(48, 59))
            is_satisfactory = False
            feedback_text = "You touched on some basic points, but the response lacked depth and specific examples required for proper evaluation."
        else:
            score = float(random.randint(70, 95))
            is_satisfactory = True
            feedback_text = "Solid explanation. You explained the concepts clearly with appropriate domain vocabulary."
            
        return {"score": score, "is_satisfactory": is_satisfactory, "feedback_text": feedback_text}

    @staticmethod
    def generate_session_feedback(questions_and_answers: List[Dict[str, Any]], api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Generates overall assessment: strengths, weaknesses, recommendations, and learning resources.
        """
        keys = AIService.get_api_keys(api_keys)
        gemini_key = keys["gemini_api_key"]
        openai_key = keys["openai_api_key"]
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                qa_summary = ""
                for idx, qa in enumerate(questions_and_answers):
                    qa_summary += f"Q{idx+1}: {qa['question']}\nA{idx+1}: {qa['answer']}\nScore: {qa.get('score')}\n\n"
                    
                prompt = f"""
                You are a career development coach and interview evaluator. Analyze the candidate's performance across the mock interview:
                
                {qa_summary}
                
                Generate feedback as JSON containing strengths, weaknesses, action recommendations, and learning resources.
                Return ONLY a JSON object with this exact structure:
                {{
                    "strengths": ["Strength 1", "Strength 2", ...],
                    "weaknesses": ["Weakness 1", "Weakness 2", ...],
                    "recommendations": ["Recommendation 1", "Recommendation 2", ...],
                    "resources": [
                        {{"title": "Resource Name", "type": "Course / Book / Article", "url": "URL description"}}
                    ]
                }}
                """
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                return json.loads(response_text)
            except Exception as e:
                print(f"Gemini session feedback failed: {e}. Using mock generator.")
                
        return {
            "strengths": [
                "Demonstrated relevant technical background alignment with the job description.",
                "Good clarity when explaining core project responsibilities."
            ],
            "weaknesses": [
                "Some initial answers were brief and required follow-up probing to assess depth.",
                "Could expand more on edge-case handling and system metrics."
            ],
            "recommendations": [
                "Use the STAR framework (Situation, Task, Action, Result) to structure initial responses with quantitative details.",
                "Practice deep-diving into architectural trade-offs mentioned in the job description."
            ],
            "resources": [
                {"title": "Designing Data-Intensive Applications", "type": "Book", "url": "Focus on distributed system patterns."},
                {"title": "Tech Interview Handbook", "type": "Website", "url": "Comprehensive guidelines for behavioral and technical interviews."}
            ]
        }

    @staticmethod
    def generate_next_question(
        domain: str, 
        difficulty: str, 
        history: List[Dict[str, str]], 
        resume_text: Optional[str] = None,
        job_description: Optional[str] = None,
        api_keys: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Generates the next question dynamically holding context.
        If candidate says 'don't know' / passes OR was already probed, bypass probing and move to next topic.
        """
        keys = AIService.get_api_keys(api_keys)
        gemini_key = keys["gemini_api_key"]
        openai_key = keys["openai_api_key"]
        
        last_item = history[-1] if history else {}
        last_q = last_item.get("question", "")
        last_a = last_item.get("answer", "")
        last_score = last_item.get("score", 70)
        last_feedback = last_item.get("feedback", "")
        
        is_dk = is_dont_know_answer(last_a)
        probing_phrases = ["elaborate", "lacked technical", "somewhat brief", "missed core implementation", "step-by-step example", "follow-up probing", "probing"]
        already_probed = any(phrase in last_q.lower() for phrase in probing_phrases)

        needs_probing = (not is_dk) and (not already_probed) and (
            (last_score is not None and last_score < 60) or "brief" in last_feedback.lower() or "incomplete" in last_feedback.lower()
        )

        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                
                history_str = ""
                for idx, qa in enumerate(history):
                    history_str += f"Question {idx+1}: {qa['question']}\nAnswer {idx+1}: {qa['answer']}\nScore: {qa.get('score')}\nFeedback: {qa.get('feedback')}\n\n"
                
                if is_dk:
                    instruction = "The candidate explicitly stated they don't know, have no experience with, or passed on the topic. DO NOT ask any follow-up or probing questions on this topic! Immediately move to a NEW question topic from their Resume or Job Description."
                elif already_probed:
                    instruction = "The candidate was ALREADY asked a probing follow-up question on this topic. Move on to a NEW topic from their Resume or Job Description regardless of score."
                elif needs_probing:
                    instruction = f"The candidate's response was incomplete/brief (score: {last_score}). DO NOT change the topic! Ask a single follow-up/probing question on the EXACT SAME topic, pointing out what was vague, so their knowledge can be properly evaluated."
                else:
                    instruction = "The candidate's response was satisfactory. Ask the next logical dynamic question phrasing it around their resume experience and JD requirements."

                prompt = f"""
                You are a senior technical interviewer in the '{domain}' domain evaluating a candidate for the position.
                Job Description:
                {job_description or "N/A"}
                Candidate Resume:
                {resume_text or "N/A"}

                Interview History:
                {history_str}

                CRITICAL INSTRUCTION:
                {instruction}

                Return ONLY a JSON object:
                {{
                    "text": "The next question text.",
                    "category": "technical" // or "behavioral", "hr", "aptitude"
                }}
                """
                response = model.generate_content(prompt)
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                return json.loads(response_text)
            except Exception as e:
                print(f"Gemini conversational question failed: {e}. Using dynamic fallback.")
                
        # Dynamic Fallback Question Generator for follow-ups
        if not history:
            return {
                "text": "To begin, please introduce yourself and summarize how your background aligns with the Job Description requirements.",
                "category": "hr"
            }
            
        ctx = extract_key_context(resume_text, job_description)
        r_skills = ctx["resume_skills"]
        jd_skills = ctx["jd_skills"]
        r_skill = random.choice(r_skills) if r_skills else "this skill"
        jd_skill = random.choice(jd_skills) if jd_skills else "system architecture"

        if needs_probing:
            probing_templates = [
                f"Your response regarding '{last_q[:55]}...' was somewhat brief. Could you elaborate specifically on how you handled this in practice using {r_skill} so we can properly evaluate your response?",
                f"You touched on basic concepts for '{last_q[:55]}...', but missed core implementation details. What specific architecture or trade-offs did you consider?",
                f"To properly evaluate your answer to '{last_q[:55]}...', can you provide a concrete step-by-step example from your experience with {r_skill}?"
            ]
            return {
                "text": random.choice(probing_templates),
                "category": "technical"
            }
        else:
            followup_templates = [
                {
                    "text": f"Great. Moving forward, the job description requires strong competency in {jd_skill}. Looking at your experience at {ctx['company_name']}, how have you managed production deployment or testing for this?",
                    "category": "technical"
                },
                {
                    "text": f"Can you share an instance from your work with {r_skill} where a technical constraint forced you to change your architectural approach mid-project?",
                    "category": "behavioral"
                },
                {
                    "text": f"In terms of team dynamics and project deliverables, how do you handle unexpected shifts in priority from product management while maintaining code quality for {jd_skill}?",
                    "category": "hr"
                },
                {
                    "text": f"If you were tasked with building a feature described in {ctx['jd_summary'][:60]}, walk me through your step-by-step design from database schema to API layer.",
                    "category": "technical"
                }
            ]
            asked_texts = [h["question"].lower() for h in history]
            available = [f for f in followup_templates if f["text"].lower() not in asked_texts]
            return random.choice(available) if available else random.choice(followup_templates)
