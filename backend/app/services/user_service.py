from app.models.user_model import User



def get_user_profile(user):


    return {

        "id": user.id,

        "name": user.full_name,

        "email": user.email,

        "phone": user.phone,

        "role": user.role.name

    }