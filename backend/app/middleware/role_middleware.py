from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.models.user_model import User


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            try:
                verify_jwt_in_request()

                user_id = get_jwt_identity()

                user = User.query.filter_by(id=user_id).first()

                if user is None:
                    return jsonify({
                        "success": False,
                        "message": "User not found"
                    }), 404

                if not user.is_active:
                    return jsonify({
                        "success": False,
                        "message": "Account is disabled"
                    }), 403

                role = user.role.name if user.role else ""

                if role not in allowed_roles:
                    return jsonify({
                        "success": False,
                        "message": "Permission denied"
                    }), 403

                return function(current_user=user, *args, **kwargs)

            except Exception as e:

                return jsonify({
                    "success": False,
                    "message": str(e)
                }), 401

        return wrapper

    return decorator