from core.exceptions import NotFoundError

from apps.interview.models import InterviewSession


def get_owned_session_or_404(*, candidate, session_id) -> InterviewSession:
    session = InterviewSession.objects.filter(pk=session_id, candidate=candidate).first()
    if session is None:
        raise NotFoundError("Interview session not found.")
    return session
