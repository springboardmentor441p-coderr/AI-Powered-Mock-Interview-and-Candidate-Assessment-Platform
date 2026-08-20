import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Role, User
from ..schemas import UltravoxCallOut
from .interviews import get_interview

router = APIRouter(prefix="/voice", tags=["voice interviewer"])
ULTRAVOX_CREATE_CALL_URL = "https://api.ultravox.ai/api/calls"


def interviewer_prompt(candidate_name: str, questions: list[str]) -> str:
    question_list = "\n".join(f"{index + 1}. {question}" for index, question in enumerate(questions))
    return f"""You are Nova, a friendly professional AI mock interviewer for SmartHire.
The candidate is {candidate_name}. This is practice, not a real hiring decision.
Ask the questions below one at a time. Wait for the candidate's answer before continuing.
Use one short follow-up question only when it helps the candidate explain a concrete example.
Be supportive, concise, and do not make employment decisions or claims about emotion, personality, or truthfulness.
End after the final answer by thanking the candidate and suggesting they view their SmartHire practice report.

Interview questions:
{question_list}"""


@router.post("/ultravox-call/{interview_id}", response_model=UltravoxCallOut)
def create_ultravox_call(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    api_key = os.getenv("ULTRAVOX_API_KEY")
    if not api_key:
        raise HTTPException(503, "Ultravox is not configured. Add ULTRAVOX_API_KEY to your .env file and restart Docker.")
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "in_progress":
        raise HTTPException(400, "Start or resume an in-progress interview before connecting voice.")
    payload = {
        "systemPrompt": interviewer_prompt(user.full_name, [item.question for item in interview.questions]),
        "temperature": 0.2,
        "languageHint": "en-IN",
        "joinTimeout": "60s",
        "maxDuration": "900s",
        "metadata": {"smartHireInterviewId": str(interview.id), "candidateId": str(user.id)},
    }
    request = Request(ULTRAVOX_CREATE_CALL_URL, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json", "X-API-Key": api_key}, method="POST")
    try:
        with urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise HTTPException(502, f"Ultravox rejected the call request: {detail[:250]}") from error
    except URLError as error:
        raise HTTPException(502, "Could not connect to Ultravox. Check your internet connection and try again.") from error
    if not data.get("joinUrl") or not data.get("callId"):
        raise HTTPException(502, "Ultravox did not return a valid call join URL.")
    return {"call_id": data["callId"], "join_url": data["joinUrl"]}
