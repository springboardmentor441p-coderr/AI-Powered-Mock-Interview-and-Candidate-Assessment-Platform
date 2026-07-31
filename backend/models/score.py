from extensions import db


class Score(db.Model):
    __tablename__ = "scores"

    id = db.Column(db.Integer, primary_key=True)