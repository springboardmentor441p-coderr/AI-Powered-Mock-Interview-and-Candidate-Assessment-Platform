import json
import re
import random
from typing import List, Dict, Any, Optional

# Pre-defined library of questions for Mock fallback
MOCK_QUESTION_DATABASE = {
    "Software Engineering": {
        "Easy": [
            {"text": "Explain the difference between 'let', 'const', and 'var' in JavaScript.", "category": "technical"},
            {"text": "What is the purpose of an index in a database, and how does it speed up queries?", "category": "technical"},
            {"text": "Tell me about a time you had to work with a team member who had a different opinion. How did you resolve it?", "category": "behavioral"},
            {"text": "Why do you want to join our company as a software developer?", "category": "hr"},
            {"text": "A car travels at 60 mph for 2 hours. If it stops for 30 minutes, what is its average speed over the entire 2.5-hour duration?", "category": "aptitude"}
        ],
        "Medium": [
            {"text": "Explain what the virtual DOM is in React and how the reconciliation process works.", "category": "technical"},
            {"text": "What are the key differences between SQL and NoSQL databases, and when would you use one over the other?", "category": "technical"},
            {"text": "Describe a challenging technical bug you encountered. How did you debug and resolve it?", "category": "behavioral"},
            {"text": "How do you handle tight deadlines or stressful situations in a sprint?", "category": "hr"},
            {"text": "If five machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?", "category": "aptitude"}
        ],
        "Hard": [
            {"text": "Describe how you would design a highly scalable, real-time chat application. What technologies and protocols would you use?", "category": "technical"},
            {"text": "Explain the concept of microservices architecture, its advantages, and how you handle distributed transactions or consistency.", "category": "technical"},
            {"text": "Tell me about a project that failed or fell behind schedule under your leadership. What did you learn and do differently next time?", "category": "behavioral"},
            {"text": "Where do you see yourself in five years? How does this role align with your long-term career goals?", "category": "hr"},
            {"text": "There are three boxes, one with apples, one with oranges, and one with both. All boxes are mislabeled. You can pull one fruit from one box. How do you label them all correctly?", "category": "aptitude"}
        ]
    },
    "Data Science": {
        "Easy": [
            {"text": "What is the difference between supervised and unsupervised learning?", "category": "technical"},
            {"text": "Explain the concept of overfitting and one way to prevent it.", "category": "technical"},
            {"text": "Describe a data project you worked on. What was your role and what did you achieve?", "category": "behavioral"},
            {"text": "Why are you interested in data science, and how do you stay updated with industry trends?", "category": "hr"},
            {"text": "A box contains 5 red balls and 5 blue balls. If you draw two balls at random without replacement, what is the probability that both are red?", "category": "aptitude"}
        ],
        "Medium": [
            {"text": "How does a Random Forest classifier work, and how does it differ from a simple Decision Tree?", "category": "technical"},
            {"text": "Explain the bias-variance tradeoff in machine learning and how it affects model selection.", "category": "technical"},
            {"text": "Tell me about a time you had to explain a complex data insight to a non-technical stakeholder. How did you approach it?", "category": "behavioral"},
            {"text": "How do you handle missing or noisy data in a dataset before modeling?", "category": "hr"},
            {"text": "What is the relation between Mean, Median, and Mode in a standard right-skewed distribution?", "category": "aptitude"}
        ],
        "Hard": [
            {"text": "Explain the mathematical formulation of gradient descent. What is the difference between Batch, Mini-batch, and Stochastic gradient descent?", "category": "technical"},
            {"text": "How do transformers and self-attention mechanisms work in modern LLMs?", "category": "technical"},
            {"text": "Describe a situation where your machine learning model performed poorly in production. How did you diagnose the issue and fix it?", "category": "behavioral"},
            {"text": "What are the ethical implications of AI systems, particularly concerning bias and fairness, and how do you mitigate them?", "category": "hr"},
            {"text": "Suppose you run a test for a rare disease that is 99% accurate (true positive rate of 99%, false positive rate of 1%). If 0.1% of the population has this disease, what is the probability that a person who tests positive actually has it?", "category": "aptitude"}
        ]
    },
    "Product Management": {
        "Easy": [
            {"text": "What is a product lifecycle, and how do you manage different stages?", "category": "technical"},
            {"text": "How do you define key performance indicators (KPIs) for a new feature launch?", "category": "technical"},
            {"text": "Tell me about a time you had to prioritize features with limited resources. What framework did you use?", "category": "behavioral"},
            {"text": "What makes a great product manager in your opinion?", "category": "hr"},
            {"text": "Estimate the number of windows in a city like New York. Walk me through your estimation process.", "category": "aptitude"}
        ],
        "Medium": [
            {"text": "How would you design a product roadmap for a mobile banking app targeting Gen-Z?", "category": "technical"},
            {"text": "How do you handle feature requests from sales or major clients that conflict with your long-term product vision?", "category": "technical"},
            {"text": "Describe a conflict you had with an engineering team regarding product requirements. How did you align everyone?", "category": "behavioral"},
            {"text": "How do you define success, and how do you handle failure in a product launch?", "category": "hr"},
            {"text": "If a user acquisition cost is $15 and the customer lifetime value is $50, but user churn rate is 20% per month, is this a viable product model?", "category": "aptitude"}
        ],
        "Hard": [
            {"text": "How would you design a monetization strategy for a popular free-to-play educational mobile app?", "category": "technical"},
            {"text": "Walk me through how you would decide whether to build, partner, or buy a critical search service for an e-commerce platform.", "category": "technical"},
            {"text": "Tell me about a time a product you owned failed. What went wrong, how did you handle it, and what did you learn?", "category": "behavioral"},
            {"text": "How do you manage pressure from executive leadership when a key release is delayed?", "category": "hr"},
            {"text": "Estimate the annual market size for electric vehicle charging stations in the US by 2030.", "category": "aptitude"}
        ]
    }
}

# Add default general pool for other domains
MOCK_QUESTION_DATABASE["General"] = MOCK_QUESTION_DATABASE["Software Engineering"]


class AIService:
    @staticmethod
    def parse_resume(resume_text: str, api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Parses resume text. Uses real LLM if API Key is configured, otherwise fallback to smart regex analysis.
        """
        gemini_key = api_keys.get("gemini_api_key") if api_keys else None
        openai_key = api_keys.get("openai_api_key") if api_keys else None
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash') # or gemini-2.5-pro
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
                # Similar implementation for OpenAI...
                # For brevity, let's fall through if it fails, or implement a simple ChatGPT call
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
    def generate_questions(domain: str, difficulty: str, parsed_skills: List[str], api_keys: Optional[Dict[str, str]] = None) -> List[Dict[str, str]]:
        """
        Generates 5 questions.
        """
        gemini_key = api_keys.get("gemini_api_key") if api_keys else None
        openai_key = api_keys.get("openai_api_key") if api_keys else None
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                skills_str = ", ".join(parsed_skills) if parsed_skills else "General technical skills"
                prompt = f"""
                You are an expert AI interviewer. Generate exactly 5 interview questions for a candidate applying in the '{domain}' domain with '{difficulty}' difficulty.
                Tailor some of the technical questions to the candidate's skills: {skills_str}.
                Return a JSON array of exactly 5 elements, each element having this structure:
                {{
                    "text": "The interview question text.",
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
                print(f"Gemini question generation failed: {e}. Using mock database.")
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                skills_str = ", ".join(parsed_skills) if parsed_skills else "General technical skills"
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional AI interviewer that returns a JSON list of questions."},
                        {"role": "user", "content": f"Generate 5 questions for domain: {domain}, difficulty: {difficulty}, with skills: {skills_str}."}
                    ],
                    response_format={"type": "json_object"}
                )
                data = json.loads(response.choices[0].message.content)
                # handle formats if nested in a key
                if isinstance(data, dict):
                    for k, v in data.items():
                        if isinstance(v, list) and len(v) == 5:
                            return v
                return data
            except Exception as e:
                print(f"OpenAI question generation failed: {e}. Using mock database.")

        # Fallback to Mock Database
        db = MOCK_QUESTION_DATABASE.get(domain, MOCK_QUESTION_DATABASE["General"])
        questions = db.get(difficulty, db["Medium"])
        
        # Inject skills in first question to make it customized if domain is Software Engineering
        if domain == "Software Engineering" and parsed_skills:
            custom_tech_q = f"Since your resume lists {parsed_skills[0]}, can you explain how you've used it in a recent project and what challenges you faced?"
            questions = questions.copy()
            questions[0] = {"text": custom_tech_q, "category": "technical"}
            
        return questions

    @staticmethod
    def evaluate_answer(question: str, answer: str, api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Evaluates a single answer. Returns score (out of 100) and feedback_text.
        """
        gemini_key = api_keys.get("gemini_api_key") if api_keys else None
        openai_key = api_keys.get("openai_api_key") if api_keys else None
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                prompt = f"""
                You are a senior technical interviewer. Evaluate the candidate's response to the question.
                
                Question: {question}
                Candidate's Answer: {answer}
                
                Evaluate based on technical accuracy, completeness, and clarity.
                Return ONLY a JSON object with this exact structure:
                {{
                    "score": 85, // Integer between 0 and 100
                    "feedback_text": "Constructive critique highlighting what was good and how to improve the explanation."
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
                print(f"Gemini answer evaluation failed: {e}. Using mock analyzer.")
                
        elif openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a professional technical recruiter. Evaluate the answer and return a JSON object containing score (0-100) and feedback_text."},
                        {"role": "user", "content": f"Question: {question}\nAnswer: {answer}"}
                    ],
                    response_format={"type": "json_object"}
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI answer evaluation failed: {e}. Using mock analyzer.")

        # Fallback Mock scoring based on heuristics
        word_count = len(answer.split())
        
        # Simple heuristic scoring
        if word_count < 10:
            score = float(random.randint(20, 45))
            feedback_text = "The response was extremely brief. In an interview, you should expand on your answers, explaining the context, your approach, and technical justifications. Try using the STAR method."
        elif word_count < 30:
            score = float(random.randint(50, 68))
            feedback_text = "You touched on some basic concepts but missed deeper explanations or implementation details. Try giving concrete examples or explaining the mechanics of your solution."
        else:
            # Check for keyword matches in question
            score = float(random.randint(70, 95))
            feedback_text = "Solid explanation. You explained the concepts clearly, demonstrated good domain vocabulary, and structured your explanation logical. To hit a higher mark, reference specific architectural impacts or real-world performance trade-offs."
            
        return {"score": score, "feedback_text": feedback_text}

    @staticmethod
    def generate_session_feedback(questions_and_answers: List[Dict[str, Any]], api_keys: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Generates overall assessment: strengths, weaknesses, recommendations, and learning resources.
        """
        gemini_key = api_keys.get("gemini_api_key") if api_keys else None
        openai_key = api_keys.get("openai_api_key") if api_keys else None
        
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
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                return json.loads(response_text)
            except Exception as e:
                print(f"Gemini session feedback failed: {e}. Using mock generator.")
                
        # Mock Fallback Feedback
        return {
            "strengths": [
                "Demonstrated good domain knowledge and terminology definitions.",
                "Structure of communication is coherent with logical flow."
            ],
            "weaknesses": [
                "Technical deep-dives sometimes lacked architectural considerations.",
                "Pacing could be smoother—avoid brief responses for complex conceptual prompts."
            ],
            "recommendations": [
                "Practice structural frameworks like the STAR method (Situation, Task, Action, Result) for behavioral questions.",
                "Dedicate additional study to distributed system architectures and low-level data flows."
            ],
            "resources": [
                {"title": "Designing Data-Intensive Applications", "type": "Book", "url": "Highly recommended for distributed backend systems study."},
                {"title": "Tech Interview Handbook", "type": "Website", "url": "Comprehensive study guides for core DSA and System Design topics."},
                {"title": "System Design Primer", "type": "GitHub Repo", "url": "Open source repository containing diagrams and deep-dives."}
            ]
        }

    @staticmethod
    def generate_next_question(
        domain: str, 
        difficulty: str, 
        history: List[Dict[str, str]], 
        api_keys: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Generates the next question dynamically, holding the context of previous questions and answers.
        """
        gemini_key = api_keys.get("gemini_api_key") if api_keys else None
        openai_key = api_keys.get("openai_api_key") if api_keys else None
        
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                
                # Format conversation history
                history_str = ""
                for idx, qa in enumerate(history):
                    history_str += f"Question {idx+1}: {qa['question']}\nAnswer {idx+1}: {qa['answer']}\n\n"
                
                prompt = f"""
                You are a senior technical mock interviewer in the '{domain}' domain.
                You are holding a conversational, dynamic technical assessment session. The difficulty is '{difficulty}'.
                
                Below is the transcript of the interview so far (questions asked and candidate answers):
                {history_str}
                
                Generate the NEXT logical follow-up question.
                - It must hold context of their previous answers.
                - It should either drill deeper into a technical concept they mentioned, challenge a statement they made, or ask a related follow-up to check their depth.
                - Keep the question concise (1-2 sentences).
                
                Return ONLY a JSON object with this exact structure:
                {{
                    "text": "The next follow-up question.",
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
                print(f"Gemini conversational question failed: {e}. Using mock rules.")
                
        # Mock Rule-based follow-ups
        if not history:
            return {"text": "Can you start by introducing yourself and outlining your technical background?", "category": "hr"}
            
        last_item = history[-1]
        last_q = last_item.get("question", "").lower()
        last_a = last_item.get("answer", "").lower()
        
        # Software Engineering followups
        if domain == "Software Engineering":
            if "let" in last_q or "const" in last_q:
                return {"text": "That makes sense. Follow-up: how does JavaScript handle asynchronous operations? Explain the event loop, callback queue, and microtasks.", "category": "technical"}
            if "index" in last_q or "database" in last_q:
                return {"text": "Good explanation of indices. How do you handle database normalization, and in what scenarios would you intentionally denormalize a schema?", "category": "technical"}
            if "virtual dom" in last_q or "react" in last_q:
                return {"text": "Excellent details on diffing. Follow-up: explain the difference between state and props, and how you manage global shared state in a React app.", "category": "technical"}
            if "sql" in last_q or "nosql" in last_q:
                return {"text": "Interesting comparison. How would you handle database scaling for a platform expecting millions of concurrent writes? Discuss sharding vs replication.", "category": "technical"}
            if "microservices" in last_q or "scalable" in last_q:
                return {"text": "Since we are talking about large scales, how do you secure API microservices? Explain JWT validation and OAuth2 authorization code flows.", "category": "technical"}
            if "bug" in last_q or "challenging" in last_q:
                return {"text": "Interesting scenario. How do you handle code reviews when a teammate submits code that doesn't follow style guides or architectural patterns?", "category": "behavioral"}
            if "deadline" in last_q or "stressful" in last_q:
                return {"text": "Good prioritization. Tell me about a time you had to pivot a feature mid-sprint because of changing user requirements. How did you react?", "category": "behavioral"}
            if "widgets" in last_q:
                return {"text": "Correct. Let's do another problem-solving prompt: A user complains that a page loads slowly. Walk me through your step-by-step troubleshooting checklist.", "category": "technical"}
                
        # Data Science followups
        elif domain == "Data Science":
            if "supervised" in last_q:
                return {"text": "Understood. Can you explain the difference between K-Means clustering and KNN classification?", "category": "technical"}
            if "overfitting" in last_q:
                return {"text": "You mentioned regularization. Explain L1 (Lasso) vs L2 (Ridge) regression and how they affect model weights.", "category": "technical"}
            if "random forest" in last_q:
                return {"text": "Great details. How do you evaluate a model's performance on highly imbalanced classification datasets? Discuss ROC-AUC and F1-score.", "category": "technical"}
            if "bias-variance" in last_q:
                return {"text": "Good. If your training error is extremely low but validation error is very high, is the model suffering from high bias or high variance? How do you fix it?", "category": "technical"}
                
        # Product Management followups
        elif domain == "Product Management":
            if "lifecycle" in last_q:
                return {"text": "Follow-up: How do you decide whether to retire or sunset a legacy product that still has active, paying users?", "category": "technical"}
            if "roadmap" in last_q:
                return {"text": "Good structure. What is the difference between RICE and MoSCoW prioritization frameworks, and which do you prefer in a fast-moving startup?", "category": "technical"}
                
        # General follow-up pool
        default_followups = [
            {"text": "Can you expand on how you would test the solution you just described to ensure high quality?", "category": "technical"},
            {"text": "How do you keep up with new frameworks, tools, or changes in this domain?", "category": "hr"},
            {"text": "Tell me about a time you made a technical mistake. How did you identify it, and how did you communicate it to your team?", "category": "behavioral"},
            {"text": "If you had infinite time and resources, how would you rebuild or optimize the last project you worked on?", "category": "technical"}
        ]
        
        # Pick one that isn't already in history
        asked_questions = [h["question"].lower() for h in history]
        for f in default_followups:
            if f["text"].lower() not in asked_questions:
                return f
                
        return default_followups[0]
