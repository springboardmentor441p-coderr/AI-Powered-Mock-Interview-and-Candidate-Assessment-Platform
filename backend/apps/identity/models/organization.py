import uuid

from django.db import models


class Organization(models.Model):
    """Recruitment agency / university / company a recruiter or admin belongs to."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "identity"
        db_table = "organizations"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
