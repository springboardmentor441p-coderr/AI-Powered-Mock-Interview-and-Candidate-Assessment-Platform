"""
models/user.py — User table (candidates, recruiters, admins)
"""
from datetime import datetime
from sqlalchemy import DateTime, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]  = mapped_column(primary_key=True, index=True)
    email:           Mapped[str]  = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str]  = mapped_column(String(255))
    full_name:       Mapped[str]  = mapped_column(String(255), default="")
    role:            Mapped[str]  = mapped_column(String(50), default="candidate")  # candidate | recruiter | admin
    is_active:       Mapped[bool] = mapped_column(Boolean, default=True)
    created_at:      Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
