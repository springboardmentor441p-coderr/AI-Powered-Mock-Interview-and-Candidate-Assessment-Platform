from functools import wraps

from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt_identity
)

from app.models.user_model import User



def jwt_required_custom():

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            verify_jwt_in_request()

            user_id = get_jwt_identity()

            user = User.query.filter_by(
                id=user_id
            ).first()


            if not user:

                return {
                    "message": "User not found"
                }, 404


            return function(
                user,
                *args,
                **kwargs
            )


        return wrapper

    return decorator