from app import app
from app.extensions import db
from app.models.role_model import Role


roles = [
    "Candidate",
    "Recruiter",
    "Admin"
]


with app.app_context():

    for role_name in roles:

        existing_role = Role.query.filter_by(
            name=role_name
        ).first()


        if not existing_role:

            role = Role(
                name=role_name
            )

            db.session.add(role)


    db.session.commit()


    print("Roles inserted successfully")