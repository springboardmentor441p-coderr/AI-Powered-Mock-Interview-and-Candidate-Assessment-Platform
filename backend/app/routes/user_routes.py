from flask import Blueprint, jsonify

from app.middleware.auth_middleware import (
    jwt_required_custom
)

from app.services.user_service import (
    get_user_profile
)



user_bp = Blueprint(

    "user",

    __name__,

    url_prefix="/api/user"

)



@user_bp.route(
    "/profile",
    methods=["GET"]
)
@jwt_required_custom()

def profile(user):


    data = get_user_profile(
        user
    )


    return jsonify(

        data

    ), 200