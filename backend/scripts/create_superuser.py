"""
Management helper: run with
  python manage.py shell < scripts/create_superuser.py
to create an initial admin account in any environment.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.identity.models import User

email = os.environ.get("ADMIN_EMAIL", "admin@smarthire.ai")
password = os.environ.get("ADMIN_PASSWORD", "changeme123!")

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password)  # type: ignore[union-attr]
    print(f"Superuser created: {email}")
else:
    print(f"Superuser already exists: {email}")
