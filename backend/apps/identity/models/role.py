from django.db import models


class Role(models.TextChoices):
    """Coarse-grained RBAC discriminator used throughout the API."""

    CANDIDATE = "candidate", "Candidate"
    RECRUITER = "recruiter", "Recruiter"
    ADMIN = "admin", "Admin"
