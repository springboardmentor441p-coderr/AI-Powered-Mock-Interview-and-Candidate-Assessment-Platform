from flask_jwt_extended import create_access_token


from app.extensions import db


from app.models.user_model import User


from app.models.role_model import Role


from app.utils.password import (
    hash_password,
    check_password
)



def register_user(data):


    existing_user = User.query.filter_by(

        email=data["email"]

    ).first()



    if existing_user:

        return {
            "message":
            "Email already registered"
        },400



    role = Role.query.filter_by(

        name=data.get(
            "role",
            "Candidate"
        )

    ).first()



    if not role:

        return {
            "message":
            "Invalid role"
        },400



    user = User(

        full_name=data["full_name"],

        email=data["email"],

        password=hash_password(
            data["password"]
        ),

        phone=data.get(
            "phone"
        ),

        role_id=role.id

    )



    db.session.add(user)

    db.session.commit()



    return {

        "message":
        "User registered successfully"

    },201





def login_user(data):


    user = User.query.filter_by(

        email=data["email"]

    ).first()



    if not user:

        return {

            "message":
            "Invalid credentials"

        },401



    if not check_password(

        user.password,

        data["password"]

    ):

        return {

            "message":
            "Invalid credentials"

        },401




    token = create_access_token(

        identity=str(user.id)

    )



    return {


        "message":
        "Login successful",


        "token":
        token,


        "user":{

            "id":
            user.id,


            "name":
            user.full_name,


            "email":
            user.email,


            "role":
            user.role.name

        }

    },200