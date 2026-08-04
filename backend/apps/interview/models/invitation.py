import uuid

from django.conf import settings
from django.db import models


class InvitationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    EXPIRED = "expired", "Expired"


class InterviewInvitation(models.Model):
    """
    Sent by a recruiter to a candidate email.
    When accepted, the candidate creates (or is linked to) a session
    from the specified template.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who sent it
    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
    )

    # Who it is addressed to (email — candidate may not exist yet)
    candidate_email = models.EmailField(db_index=True)

    # Resolved once the candidate accepts
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_invitations",
    )

    template = models.ForeignKey(
        "interview.InterviewTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations",
    )

    # Optional note shown to the candidate
    message = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING,
        db_index=True,
    )

    # Filled once candidate starts the invited session
    session = models.OneToOneField(
        "interview.InterviewSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitation",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_invitations"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Invitation({self.recruiter_id} → {self.candidate_email}, {self.status})" # type: ignore