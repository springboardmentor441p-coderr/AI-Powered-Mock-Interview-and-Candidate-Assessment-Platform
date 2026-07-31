"""
User Model
"""

from datetime import datetime

from extensions import db
from extensions import bcrypt


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    full_name = db.Column(
        db.String(120),
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

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # -----------------------
    # Password
    # -----------------------

    def set_password(self, password):

        self.password = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    def check_password(self, password):

        return bcrypt.check_password_hash(
            self.password,
            password
        )

    def to_dict(self):

        return {

            "id": self.id,

            "name": self.full_name,

            "email": self.email,

            "role": self.role.name if self.role else None

        }