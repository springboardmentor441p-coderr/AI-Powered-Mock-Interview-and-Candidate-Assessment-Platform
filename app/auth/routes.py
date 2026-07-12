"""
Authentication routes - registration, login, logout, JWT, Google OAuth.
"""
from urllib.parse import urljoin

import requests
from authlib.integrations.flask_client import OAuth
from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from flask_login import current_user, login_required, login_user, logout_user

from app.auth.decorators import login_required_web
from app.auth.forms import LoginForm, RegistrationForm
from app.auth.services import AuthService
from app.extensions import csrf, db
from app.models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
oauth = OAuth()


def init_oauth(app) -> None:
    """Initialize Google OAuth client."""
    oauth.init_app(app)
    if not app.config.get("GOOGLE_OAUTH_ENABLED"):
        return
    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """User registration page."""
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    form = RegistrationForm()
    if form.validate_on_submit():
        user, error = AuthService.register_user(
            email=form.email.data,
            username=form.username.data,
            password=form.password.data,
            full_name=form.full_name.data,
            role_name=form.role.data,
        )
        if error:
            flash(error, "danger")
        else:
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for("auth.login"))
    elif request.method == "POST":
        flash("Please fix the errors below and try again.", "danger")

    return render_template("auth/register.html", form=form)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """User login page."""
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        user, error = AuthService.authenticate(
            login_id=form.email.data,
            password=form.password.data,
        )
        if error:
            flash(error, "danger")
        else:
            login_user(user, remember=True)
            flash(f"Welcome back, {user.full_name or user.username}!", "success")
            next_page = request.args.get("next")
            if next_page:
                return redirect(next_page)
            return redirect(url_for("main.dashboard"))
    elif request.method == "POST":
        flash("Please fix the errors below and try again.", "danger")

    return render_template(
        "auth/login.html",
        form=form,
        google_oauth_enabled=current_app.config.get("GOOGLE_OAUTH_ENABLED", False),
    )


@auth_bp.route("/logout")
@login_required
def logout():
    """Logout current user."""
    AuthService.log_action(current_user.id, "user_logout", "Session logout")
    db.session.commit()
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("main.index"))


@auth_bp.route("/api/login", methods=["POST"])
@csrf.exempt
def api_login():
    """JWT API login endpoint."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user, error = AuthService.authenticate(email, password)
    if error:
        return jsonify({"error": error}), 401

    tokens = AuthService.create_tokens(user)
    return jsonify(
        {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role.name,
            },
            **tokens,
        }
    )


@auth_bp.route("/api/refresh", methods=["POST"])
@jwt_required(refresh=True)
def api_refresh():
    """Refresh JWT access token."""
    identity = get_jwt_identity()
    return jsonify({"access_token": create_access_token(identity=identity)})


@auth_bp.route("/api/me", methods=["GET"])
@jwt_required()
def api_me():
    """Get current JWT user profile."""
    identity = get_jwt_identity()
    user = User.query.get(identity["id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.name,
        }
    )


@auth_bp.route("/google/login")
def google_login():
    """Initiate Google OAuth login."""
    if not current_app.config.get("GOOGLE_OAUTH_ENABLED"):
        flash("Google OAuth is not configured. Please use email and password.", "warning")
        return redirect(url_for("auth.login"))

    redirect_uri = current_app.config["GOOGLE_REDIRECT_URI"]
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.route("/google/callback")
def google_callback():
    """Handle Google OAuth callback."""
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get("userinfo")
        if not user_info:
            resp = oauth.google.get("https://www.googleapis.com/oauth2/v3/userinfo")
            user_info = resp.json()

        role = session.pop("oauth_role", "candidate")
        user = AuthService.find_or_create_google_user(
            google_id=user_info["sub"],
            email=user_info["email"],
            full_name=user_info.get("name", ""),
            profile_image=user_info.get("picture"),
            role_name=role,
        )
        login_user(user, remember=True)
        flash("Successfully logged in with Google!", "success")
        return redirect(url_for("main.dashboard"))
    except Exception as exc:
        flash(f"Google login failed: {str(exc)}", "danger")
        return redirect(url_for("auth.login"))


@auth_bp.route("/profile")
@login_required_web
def profile():
    """User profile page."""
    return render_template("auth/profile.html", user=current_user)
