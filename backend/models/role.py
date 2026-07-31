"""
Role Model
"""

from extensions import db


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    users = db.relationship(
        "User",
        backref="role",
        lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }