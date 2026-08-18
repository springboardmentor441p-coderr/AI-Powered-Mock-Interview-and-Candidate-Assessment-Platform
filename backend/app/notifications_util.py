from sqlalchemy.orm import Session
from . import models


def notify(db: Session, user_id: int, message: str, notif_type: str = "info"):
    n = models.Notification(user_id=user_id, message=message, notif_type=notif_type)
    db.add(n)
    db.commit()
