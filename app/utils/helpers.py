"""
Utility helper functions.
"""
import os
import re
import uuid
from datetime import datetime
from typing import Optional

from flask import current_app
from werkzeug.utils import secure_filename


def allowed_file(filename: str, allowed_extensions: Optional[set] = None) -> bool:
    """
    Check if file extension is allowed.

    Args:
        filename: Name of the uploaded file.
        allowed_extensions: Set of allowed extensions.

    Returns:
        True if extension is allowed.
    """
    if not filename or "." not in filename:
        return False
    extensions = allowed_extensions or current_app.config.get(
        "ALLOWED_EXTENSIONS", {"pdf"}
    )
    return filename.rsplit(".", 1)[1].lower() in extensions


def save_upload_file(file, subfolder: str = "") -> str:
    """
    Save uploaded file and return relative path.

    Args:
        file: Werkzeug FileStorage object.
        subfolder: Subdirectory within uploads folder.

    Returns:
        Relative file path from upload root.
    """
    original_name = secure_filename(file.filename or "file")
    unique_name = f"{uuid.uuid4().hex}_{original_name}"
    upload_root = current_app.config["UPLOAD_FOLDER"]
    target_dir = os.path.join(upload_root, subfolder) if subfolder else upload_root
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, unique_name)
    file.save(file_path)
    relative = os.path.join(subfolder, unique_name) if subfolder else unique_name
    return relative.replace("\\", "/")


def calculate_overall_score(
    communication: float,
    confidence: float,
    technical: float,
    professionalism: float,
) -> float:
    """
    Calculate weighted overall interview score.

    Args:
        communication: Communication score (0-100).
        confidence: Confidence score (0-100).
        technical: Technical score (0-100).
        professionalism: Professionalism score (0-100).

    Returns:
        Weighted overall score.
    """
    from app.utils.constants import (
        WEIGHT_COMMUNICATION,
        WEIGHT_CONFIDENCE,
        WEIGHT_PROFESSIONALISM,
        WEIGHT_TECHNICAL,
    )

    return round(
        communication * WEIGHT_COMMUNICATION
        + confidence * WEIGHT_CONFIDENCE
        + technical * WEIGHT_TECHNICAL
        + professionalism * WEIGHT_PROFESSIONALISM,
        2,
    )


def extract_email(text: str) -> Optional[str]:
    """Extract first email address from text."""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text."""
    match = re.search(r"(\+?\d[\d\s\-().]{8,}\d)", text)
    return match.group(0).strip() if match else None


def utc_now() -> datetime:
    """Return current UTC datetime."""
    return datetime.utcnow()


def get_upload_absolute_path(relative_path: str) -> str:
    """
    Resolve a stored upload relative path to an absolute filesystem path.

    Args:
        relative_path: Path relative to the upload folder.

    Returns:
        Absolute path to the file.
    """
    upload_root = current_app.config["UPLOAD_FOLDER"]
    if not os.path.isabs(upload_root):
        upload_root = os.path.abspath(upload_root)
    normalized = relative_path.replace("\\", "/")
    return os.path.normpath(os.path.join(upload_root, normalized))


def format_datetime(dt: Optional[datetime]) -> str:
    """Format datetime for display."""
    if not dt:
        return "N/A"
    return dt.strftime("%Y-%m-%d %H:%M")
