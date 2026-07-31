from datetime import datetime

from app.extensions import db


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    phone = db.Column(
        db.String(15),
        nullable=True
    )

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # -----------------------------------------
    # Relationships
    # -----------------------------------------

    role = db.relationship(
        "Role",
        back_populates="users"
    )

    resumes = db.relationship(
        "Resume",
        back_populates="candidate",
        lazy=True,
        cascade="all, delete-orphan"
    )

    interviews = db.relationship(
        "Interview",
        back_populates="candidate",
        lazy=True,
        cascade="all, delete-orphan"
    )

    # -----------------------------------------
    # Helper Methods
    # -----------------------------------------

    def to_dict(self):

        return {

            "id": self.id,

            "full_name": self.full_name,

            "email": self.email,

            "phone": self.phone,

            "role": self.role.name if self.role else None,

            "is_active": self.is_active,

            "created_at": self.created_at.isoformat()

        }

    def __repr__(self):

        return f"<User {self.email}>"