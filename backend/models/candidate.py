from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class Candidate(BaseModel):
    id: str = Field(alias="_id", default="")
    email: str
    name: str = "Candidate"
    resume_name: Optional[str] = None
    resume_preview: Optional[str] = None
    resume_path: Optional[str] = None
    resume_uploaded: bool = False
    college_name: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["created_at"] = self.created_at.isoformat()
        return d

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)
