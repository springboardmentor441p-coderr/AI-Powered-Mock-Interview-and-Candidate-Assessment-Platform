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
        candidate_name: Optional[str] = None,
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
                name_clause = f"The candidate's name is {candidate_name}." if candidate_name else ""
                prompt = f"""
                You are Sarah Chen, a seasoned Senior Technical Hiring Manager with 12 years of experience in {domain}. You are conducting a structured mock interview.
                {name_clause}

                YOUR PERSONALITY:
                - Warm but professional. You put candidates at ease with brief small talk before diving in.
                - You actively listen, nod along (say "mm-hmm", "I see", "interesting"), and ask natural follow-up questions.
                - You occasionally share brief, relevant observations like "That's a great approach" or "Many of our team members have similar experience."
                - You never sound robotic or like you're reading from a script.

                Generate exactly 5 potential interview questions for a candidate applying in the '{domain}' domain with '{difficulty}' difficulty.
                
                Mandatory Context:
                Job Description:
                {job_description or "General position requirements"}

                Candidate Resume / Profile:
                {resume_text or f"Skills: {skills_str}"}

                CRITICAL INSTRUCTION FOR THE FIRST QUESTION (Index 0 of the returned list):
                - The first question MUST be the WARM-UP question: Greet the candidate warmly (e.g. "Hi {candidate_name or 'there'}! Thanks for joining today.") and ask them to briefly introduce themselves and what excites them about this role.
                - The subsequent questions (Index 1 to 4) should be targeted interview questions mapped to Experience & Motivation, Technical Deep-Dive, and Behavioral stages, phrased strictly around Candidate Resume and Job Description.

                Return a JSON array of exactly 5 elements, each element having this structure:
                {{
                    "text": "The interview question text.",
                    "category": "One of: 'technical', 'hr', 'behavioral', 'aptitude'"
                }}
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
                name_clause = f"The candidate's name is {candidate_name}." if candidate_name else ""
                system_content = f"""
                You are Sarah Chen, a seasoned Senior Technical Hiring Manager with 12 years of experience in {domain}. You are conducting a structured mock interview.
                {name_clause}

                YOUR PERSONALITY:
                - Warm but professional. You put candidates at ease with brief small talk before diving in.
                - You actively listen, nod along (say "mm-hmm", "I see", "interesting"), and ask natural follow-up questions.
                - You occasionally share brief, relevant observations like "That's a great approach" or "Many of our team members have similar experience."
                - You never sound robotic or like you're reading from a script.
                """
                user_msg = f"""
                Job Description: {job_description}
                Candidate Resume: {resume_text}

                CRITICAL INSTRUCTION FOR THE FIRST QUESTION (Index 0 of the returned list):
                - The first question MUST be the WARM-UP question: Greet the candidate warmly (e.g. "Hi {candidate_name or 'there'}! Thanks for joining today.") and ask them to briefly introduce themselves and what excites them about this role.
                - The subsequent questions (Index 1 to 4) should be targeted interview questions mapped to Experience & Motivation, Technical Deep-Dive, and Behavioral stages.
                
                Return a JSON array of exactly 5 elements, each element having this structure:
                {{
                    "text": "The interview question text.",
                    "category": "technical" // or "hr", "behavioral", "aptitude"
                }}
                """
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_content},
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
        
        name = candidate_name or "there"

        dynamic_qs = [
            {
                "text": f"Hi {name}! Thanks for joining today. Could you briefly introduce yourself and share what excites you about this role?",
                "category": "hr"
            },
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
                "text": f"Suppose a service in production handling {jd_skill} suddenly experiences a 5x spike in latency. Based on your hands-on experience with {r_skill1}, how would you systematically diagnose and resolve the bottleneck?",
                "category": "aptitude"
            }
        ]
        rest = dynamic_qs[1:]
        random.shuffle(rest)
        return [dynamic_qs[0]] + rest

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
        candidate_name: Optional[str] = None,
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
        
        # Check if the last question itself was a probing/follow-up question
        probing_phrases = [
            "elaborate", "expand on", "go deeper", "why did you choose", "what tradeoffs", "trade-offs",
            "could you give me a concrete example", "follow-up", "probing"
        ]
        last_q_was_probing = (last_item.get("category", "") == "probing") or any(phrase in last_q.lower() for phrase in probing_phrases)

        # Check if the last score was low (under 60) or feedback highlights briefness
        last_score_low = last_score is not None and last_score < 60
        last_feedback_brief = False
        if last_feedback:
            last_feedback_brief = any(w in last_feedback.lower() for w in ["brief", "incomplete", "vague", "lack", "missing"])

        needs_probing = (not is_dk) and (not last_q_was_probing) and (last_score_low or last_feedback_brief)

        num_questions = len(history) + 1
        
        # Stages mapping
        stages_desc = {
            1: f"Stage 1: WARM-UP. Greet the candidate warmly (e.g. 'Hi {candidate_name or 'there'}! Thanks for joining today.') and ask them to briefly introduce themselves and what excites them about this role.",
            2: "Stage 2: EXPERIENCE & MOTIVATION. Ask about their current or most recent role and key achievements.",
            3: "Stage 3: EXPERIENCE & MOTIVATION. Ask specifically about their experience with key skills/technologies from their resume, or ask why they are interested in this particular role/domain.",
            4: "Stage 4: TECHNICAL DEEP-DIVE. Ask a targeted technical question related to the core skills mentioned in the job description or resume.",
            5: "Stage 5: TECHNICAL DEEP-DIVE. Ask another targeted technical question related to the core skills, exploring a different aspect or tool.",
            6: "Stage 6: TECHNICAL DEEP-DIVE SCENARIO. Include ONE scenario-based question like: 'Imagine you're tasked with [realistic scenario related to the job]. How would you approach it?'",
            7: "Stage 7: BEHAVIORAL. Ask about a challenging situation: 'Tell me about a time you had to [relevant challenge for this role, e.g., resolve a conflict or handle a tight deadline].' or ask about teamwork/collaboration style.",
            8: "Stage 8: CLOSING. Ask 'Do you have any questions for me about the role or team?', thank them warmly, and say you'll follow up soon."
        }
        
        current_stage_instruction = stages_desc.get(num_questions, stages_desc[8])
        
        # Dynamic directive for follow-up vs next topic
        if is_dk:
            directive = "CRITICAL DIRECTIVE: The candidate explicitly said they don't know, have no experience with, or passed on the topic. DO NOT ask any follow-up or probing questions on this topic! Immediately move to the scheduled stage topic."
        elif last_q_was_probing:
            directive = "CRITICAL DIRECTIVE: You already asked a probing/follow-up question on this topic. Do NOT probe further. Respect the candidate's last answer and move to the scheduled stage topic."
        elif needs_probing:
            directive = f"CRITICAL DIRECTIVE: The candidate's last answer was brief, vague, or incomplete (score: {last_score or 'N/A'}). DO NOT change the topic yet. Ask a natural, concise follow-up/probing question (e.g., asking for a concrete example, why they chose that approach, or what tradeoffs they considered) to help them elaborate on this exact topic."
        else:
            directive = "CRITICAL DIRECTIVE: The candidate's response was satisfactory. Move to the scheduled stage topic."

        personality_prompt = f"""
        You are Sarah Chen, a seasoned Senior Technical Hiring Manager with 12 years of experience in {domain}. You are conducting a structured mock interview.
        The candidate's name is {candidate_name or "there"}.

        YOUR PERSONALITY:
        - Warm but professional. You put candidates at ease with brief small talk before diving in.
        - You actively listen, nod along (say "mm-hmm", "I see", "interesting"), and ask natural follow-up questions.
        - You occasionally share brief, relevant observations like "That's a great approach" or "Many of our team members have similar experience."
        - You never sound robotic or like you're reading from a script.
        - Make sure to prefix your next response with a natural transition that acknowledges the candidate's last answer if appropriate (e.g. "I see, interesting. ...", "Mm-hmm, that's a great approach. ...", "Interesting. ...").

        INTERVIEW STAGE FOR THE CURRENT QUESTION (Question {num_questions} of 8):
        {current_stage_instruction}

        IMPORTANT RULES:
        - Ask ONE question at a time.
        - Speak concisely. Your next response (including the transitional acknowledgment/phrase and the question itself) should be 1-3 sentences max.
        - Adapt your questions based on what the candidate actually says in their history.
        - NEVER repeat any question or ask a question that is semantically identical or very close to any question in the Interview History. Look at the Interview History to ensure you cover new grounds!
        """

        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                
                history_str = ""
                for idx, qa in enumerate(history):
                    history_str += f"Question {idx+1}: {qa['question']}\nAnswer {idx+1}: {qa['answer']}\nScore: {qa.get('score')}\nFeedback: {qa.get('feedback')}\n\n"
                
                prompt = f"""
                {personality_prompt}

                Job Description:
                {job_description or "N/A"}
                
                Candidate Resume:
                {resume_text or "N/A"}

                Interview History:
                {history_str}

                {directive}

                Return ONLY a JSON object:
                {{
                    "text": "The next question text containing any acknowledgment or transition prefix and the question itself (1-3 sentences max).",
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
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                history_str = ""
                for idx, qa in enumerate(history):
                    history_str += f"Question {idx+1}: {qa['question']}\nAnswer {idx+1}: {qa['answer']}\nScore: {qa.get('score')}\nFeedback: {qa.get('feedback')}\n\n"
                
                user_msg = f"""
                Job Description:
                {job_description or "N/A"}
                
                Candidate Resume:
                {resume_text or "N/A"}

                Interview History:
                {history_str}

                {directive}
                """
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": personality_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI conversational question failed: {e}. Using dynamic fallback.")
                
        # Fallback dynamic logic
        ctx = extract_key_context(resume_text, job_description)
        r_skills = ctx["resume_skills"]
        jd_skills = ctx["jd_skills"]
        r_skill = random.choice(r_skills) if r_skills else "this skill"
        jd_skill = random.choice(jd_skills) if jd_skills else "system architecture"
        name = candidate_name or "there"

        # Warm acknowledgments
        acknowledgments = ["I see.", "Interesting.", "Mm-hmm, makes sense.", "That is a great approach.", "I understand."]
        ack = random.choice(acknowledgments)

        if needs_probing:
            probing_templates = [
                f"{ack} Your response regarding that was somewhat brief. Could you elaborate specifically on how you handled this in practice using {r_skill}?",
                f"{ack} You touched on basic concepts, but missed core implementation details. What specific architecture or trade-offs did you consider?",
                f"{ack} Can you provide a concrete step-by-step example from your experience with {r_skill}?"
            ]
            return {
                "text": random.choice(probing_templates),
                "category": "probing"
            }
        
        # Stage-based templates
        if num_questions == 2:
            return {
                "text": f"{ack} Looking at your resume, could you walk me through your current or most recent role and some key achievements?",
                "category": "hr"
            }
        elif num_questions == 3:
            return {
                "text": f"{ack} Thanks for sharing. How did you specifically apply your experience with {r_skill} in that role, and what draws you to this position?",
                "category": "hr"
            }
        elif num_questions == 4:
            return {
                "text": f"{ack} Excellent. Let's do a technical deep-dive. How would you approach designing a scalable system for {jd_skill}?",
                "category": "technical"
            }
        elif num_questions == 5:
            return {
                "text": f"{ack} Makes sense. Under tight performance constraints, what key trade-offs would you consider when optimizing {jd_skill}?",
                "category": "technical"
            }
        elif num_questions == 6:
            return {
                "text": f"{ack} Scenario time: Imagine you are tasked with migrating a database handling {jd_skill} in production with zero downtime. How would you approach this?",
                "category": "technical"
            }
        elif num_questions == 7:
            return {
                "text": f"{ack} Let's shift to a behavioral question. Tell me about a time you had to resolve a technical conflict within your team.",
                "category": "behavioral"
            }
        else:
            return {
                "text": f"{ack} That brings us to the end of my questions. Do you have any questions for me about the role or team?",
                "category": "hr"
            }
