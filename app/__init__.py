"""
Flask application factory.
"""
import os

from dotenv import load_dotenv
from flask import Flask

from app.auth import auth_bp, init_oauth
from app.auth.services import AuthService
from app.config import config_by_name
from app.extensions import db, jwt, login_manager, migrate, csrf
from app.models import User


def create_app(config_name: str = None) -> Flask:
    """
    Create and configure Flask application.

    Args:
        config_name: Configuration environment name.

    Returns:
        Configured Flask app instance.
    """
    load_dotenv()

    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
        instance_relative_config=True,
    )

    env = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name.get(env, config_by_name["default"]))
    app.config["APP_NAME"] = os.getenv("APP_NAME", "InterviewIQ")
    app.config["GOOGLE_OAUTH_ENABLED"] = config_by_name.get(
        env, config_by_name["default"]
    ).is_google_oauth_configured()

    upload_folder = app.config["UPLOAD_FOLDER"]
    if not os.path.isabs(upload_folder):
        upload_folder = os.path.abspath(upload_folder)
    app.config["UPLOAD_FOLDER"] = upload_folder

    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "resumes"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "audio"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "video"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "reports"), exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    init_oauth(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    @login_manager.user_loader
    def load_user(user_id: str):
        return User.query.get(int(user_id))

    from app.admin.routes import admin_bp
    from app.candidate.routes import candidate_bp
    from app.interview.routes import interview_bp
    from app.recruiter.routes import recruiter_bp
    from app.reports.routes import reports_bp
    from app.resume.routes import resume_bp
    from app.routes.main import main_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(interview_bp)
    app.register_blueprint(candidate_bp)
    app.register_blueprint(recruiter_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(reports_bp)

    with app.app_context():
        db.create_all()
        AuthService.seed_roles()
        AuthService.seed_admin()

    @app.context_processor
    def inject_globals():
        return {"app_name": app.config.get("APP_NAME", "InterviewIQ")}

    return app
