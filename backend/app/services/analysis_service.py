import re
from typing import Dict, Any, List

class AnalysisService:
    # Common speech filler words
    FILLER_WORDS = ["um", "uh", "like", "so", "you know", "actually", "basically", "literally", "essentially"]

    # Technical keywords mapped to domains for fallback matching
    DOMAIN_KEYWORDS = {
        "Software Engineering": [
            "code", "algorithm", "database", "api", "function", "class", "react", "python", "sql", "git",
            "microservices", "scale", "performance", "deployment", "test", "docker", "thread", "memory",
            "frontend", "backend", "fullstack", "architect", "bug", "cache", "server", "framework"
        ],
        "Data Science": [
            "data", "model", "algorithm", "regression", "classification", "training", "testing", "features",
            "accuracy", "precision", "recall", "bias", "variance", "tensor", "numpy", "pandas", "sql", "analysis",
            "statistics", "probability", "gradient", "loss", "clusters", "learning", "neural", "validation"
        ],
        "Product Management": [
            "product", "user", "roadmap", "feature", "metric", "kpi", "priority", "backlog", "stakeholder",
            "customer", "market", "design", "agile", "scrum", "analytics", "growth", "strategy", "competitor",
            "mvp", "launch", "feedback", "retention", "conversion", "revenue", "requirements"
        ]
    }

    @classmethod
    def analyze_answer(
        cls, 
        question_text: str, 
        answer_text: str, 
        duration_seconds: float,
        eye_contact_pct: float,
        domain: str
    ) -> Dict[str, Any]:
        """
        Analyzes a candidate's answer and returns metrics and sub-scores.
        """
        # 1. Word Count & WPM
        words = answer_text.strip().split()
        word_count = len(words)
        
        # Calculate WPM
        if duration_seconds > 0:
            wpm = int((word_count / duration_seconds) * 60)
        else:
            wpm = 0
            
        # 2. Filler Word Detection
        filler_count = 0
        cleaned_text = re.sub(r'[^\w\s]', '', answer_text.lower())
        for word in cleaned_text.split():
            if word in cls.FILLER_WORDS:
                filler_count += 1
                
        # 3. Communication Score (30%)
        # Ideal WPM is between 110 and 150
        wpm_score = 100
        if wpm < 80:
            wpm_score = max(40, 100 - (80 - wpm) * 1.5)
        elif wpm > 180:
            wpm_score = max(40, 100 - (wpm - 180) * 1.2)
            
        # Filler word penalty
        filler_ratio = filler_count / max(1, word_count)
        filler_score = max(30, 100 - (filler_ratio * 400)) # Penalize heavily for high density
        
        # Completeness based on length
        length_score = 100
        if word_count < 15:
            length_score = 30
        elif word_count < 40:
            length_score = 65
        elif word_count < 80:
            length_score = 85
            
        communication_score = (wpm_score * 0.3) + (filler_score * 0.4) + (length_score * 0.3)

        # 4. Confidence Score (25%)
        # Use eye contact percentage directly (0-100)
        eye_score = eye_contact_pct
        
        # Transcript/Speaking hesitation simulation
        # If words per minute is extremely low, assume hesitation
        hesitation_score = 100
        if wpm < 90:
            hesitation_score = max(40, 100 - (90 - wpm) * 1.0)
            
        # Speech pattern consistency
        speech_confidence = 100 if word_count >= 20 else max(30, word_count * 5)
        
        confidence_score = (eye_score * 0.5) + (hesitation_score * 0.3) + (speech_confidence * 0.2)

        # 5. Technical Relevance Score (30%)
        # Check keyword matches
        matched_keywords = []
        keywords_to_check = cls.DOMAIN_KEYWORDS.get(domain, cls.DOMAIN_KEYWORDS["Software Engineering"])
        
        # Extract keywords from the question itself
        question_words = set(re.findall(r'\b\w{4,}\b', question_text.lower()))
        
        for kw in keywords_to_check:
            if kw.lower() in cleaned_text:
                matched_keywords.append(kw)
                
        # Look for semantic matches with question keywords
        question_match_count = 0
        for qw in question_words:
            if qw in cleaned_text and qw not in cls.FILLER_WORDS:
                question_match_count += 1
                
        # Calculate score based on unique matching domain keywords + question terms
        unique_matches = len(set(matched_keywords))
        tech_score = 40.0 # Baseline score if they say anything
        if word_count > 10:
            tech_score += min(40, unique_matches * 10)
            tech_score += min(20, question_match_count * 5)
        else:
            tech_score = 20.0 # Too short
            
        technical_score = min(100.0, tech_score)

        # 6. Professionalism Score (15%)
        # Time management: speaking between 30 and 120 seconds is ideal
        time_score = 100
        if duration_seconds < 15:
            time_score = 40
        elif duration_seconds < 30:
            time_score = 75
        elif duration_seconds > 150:
            time_score = max(50, 100 - (duration_seconds - 150) * 0.5)
            
        # Language professionalism (polite terms)
        professional_terms = ["thank you", "for example", "specifically", "designed", "implemented", "resolved", "collaborated"]
        term_matches = sum(1 for term in professional_terms if term in cleaned_text)
        polite_score = min(100, 60 + term_matches * 10)
        
        professionalism_score = (time_score * 0.6) + (polite_score * 0.4)

        return {
            "wpm": wpm,
            "filler_word_count": filler_count,
            "communication_score": round(communication_score, 1),
            "confidence_score": round(confidence_score, 1),
            "technical_score": round(technical_score, 1),
            "professionalism_score": round(professionalism_score, 1)
        }

    @classmethod
    def calculate_overall_scores(cls, answers: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Aggregates individual answer scores into overall mock interview category scores.
        """
        if not answers:
            return {
                "communication_score": 0.0,
                "confidence_score": 0.0,
                "technical_score": 0.0,
                "professionalism_score": 0.0,
                "total_score": 0.0
            }
            
        comm_sum = sum(a["communication_score"] for a in answers)
        conf_sum = sum(a["confidence_score"] for a in answers)
        tech_sum = sum(a["technical_score"] for a in answers)
        prof_sum = sum(a["professionalism_score"] for a in answers)
        n = len(answers)
        
        comm = comm_sum / n
        conf = conf_sum / n
        tech = tech_sum / n
        prof = prof_sum / n
        
        # Overall score formula:
        # Communication * 30% + Confidence * 25% + Technical * 30% + Professionalism * 15%
        overall = (comm * 0.3) + (conf * 0.25) + (tech * 0.3) + (prof * 0.15)
        
        return {
            "communication_score": round(comm, 1),
            "confidence_score": round(conf, 1),
            "technical_score": round(tech, 1),
            "professionalism_score": round(prof, 1),
            "total_score": round(overall, 1)
        }
