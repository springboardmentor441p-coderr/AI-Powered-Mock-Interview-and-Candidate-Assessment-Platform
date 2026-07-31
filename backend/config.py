"""
config.py
----------------------------------------
Application configuration for SmartHire AI.

This file loads environment variables and
stores configuration values used across
the Flask application.
"""

import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()


class Config:
    """Base application configuration."""

    # -------------------------
    # Flask
    # -------------------------
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "change-this-secret-key"
    )

    # -------------------------
    # Database
    # -------------------------
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///smarthire.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # -------------------------
    # JWT
    # -------------------------
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "jwt-secret-key"
    )

    JWT_ACCESS_TOKEN_EXPIRES = 3600

    # -------------------------
    # Uploads
    # -------------------------
    UPLOAD_FOLDER = os.path.join(
        os.getcwd(),
        "uploads"
    )

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    ALLOWED_EXTENSIONS = {"pdf"}

    # -------------------------
    # Mail
    # -------------------------
    MAIL_SERVER = os.getenv("MAIL_SERVER")

    MAIL_PORT = int(
        os.getenv("MAIL_PORT", 587)
    )

    MAIL_USE_TLS = True

    MAIL_USERNAME = os.getenv("MAIL_USERNAME")

    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    MAIL_DEFAULT_SENDER = os.getenv(
        "MAIL_DEFAULT_SENDER"
    )

    # -------------------------
    # OpenAI
    # -------------------------
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")