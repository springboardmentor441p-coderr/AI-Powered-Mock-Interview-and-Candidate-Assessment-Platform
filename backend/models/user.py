from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class User(BaseModel):
    id: str = Field(alias="_id", default="")
    email: EmailStr
    hashed_password: str
    full_name: str = ""
    role: str = "candidate"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        # Convert ObjectId to string if needed
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
