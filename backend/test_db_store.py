import requests

url = "http://localhost:8000/api/v1/interview/save-details"
payload = {
    "user_id": 1,
    "title": "Software Engineer",
    "avatar_personality": "Professional Tech Lead",
    "duration_seconds": 300,
    "video_recording_url": "uploads/recordings/test.mp4",
    "questions": [
        {
            "id": 1,
            "category": "Technical",
            "topic": "HTML/CSS",
            "question_text": "What is Flexbox?",
            "expected_points": ["1D alignment"]
        }
    ],
    "answers": [
        {
            "question_id": 1,
            "candidate_audio_transcript": "Flexbox is for 1D layout alignment.",
            "ideal_response_suggestion": "1D alignment",
            "score": 8.5,
            "feedback": "Good response."
        }
    ],
    "score": {
        "overall_score": 85.0,
        "technical_knowledge": 85.0,
        "communication": 85.0,
        "confidence": 85.0
    },
    "proctor_strikes": 0
}

response = requests.post(url, json=payload)
print("POST /save-details status:", response.status_code)
print("POST /save-details response:", response.json())

sessions_resp = requests.get("http://localhost:8000/api/v1/interview/sessions")
print("GET /sessions status:", sessions_resp.status_code)
print("GET /sessions data:", sessions_resp.json())
