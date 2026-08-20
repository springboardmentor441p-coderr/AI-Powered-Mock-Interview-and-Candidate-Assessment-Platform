import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile

async def save_pdf(file: UploadFile, upload_dir: Path) -> str:
    if file.content_type != "application/pdf": raise HTTPException(415, "Only PDF resumes are allowed")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024: raise HTTPException(413, "Maximum file size is 5 MB")
    name = f"{uuid.uuid4()}.pdf"; (upload_dir / name).write_bytes(contents)
    return name
