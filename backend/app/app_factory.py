from flask import Flask

from app.config import config

from app.extensions import (
    db,
    jwt,
    cors,
    bcrypt,
    migrate
)


def create_app(config_name="default"):

    app = Flask(__name__)

    # ----------------------------------------------------
    # Load Configuration
    # ----------------------------------------------------

    app.config.from_object(
        config[config_name]
    )

    # ----------------------------------------------------
    # Initialize Extensions
    # ----------------------------------------------------

    db.init_app(app)

    migrate.init_app(
        app,
        db
    )

    jwt.init_app(app)

    cors.init_app(
        app,
        resources={
            r"/*": {
                "origins": "*"
            }
        }
    )

    bcrypt.init_app(app)

    # ----------------------------------------------------
    # Import Models
    # ----------------------------------------------------

    from app.models.role_model import Role
    from app.models.user_model import User
    from app.models.resume_model import Resume
    from app.models.interview_model import Interview

    # ----------------------------------------------------
    # Register Blueprints
    # ----------------------------------------------------

    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.candidate_routes import candidate_bp
    from app.routes.resume_routes import resume_bp

    app.register_blueprint(auth_bp)

    app.register_blueprint(user_bp)

    app.register_blueprint(candidate_bp)

    app.register_blueprint(resume_bp)

    # ----------------------------------------------------
    # Root API
    # ----------------------------------------------------

    @app.route("/")
    def home():

        return {

            "project": "SmartHire AI",

            "status": "Backend Running",

            "version": "2.0",

            "database": "Connected",

            "authentication": "Enabled"

        }

    # ----------------------------------------------------
    # Create Database
    # ----------------------------------------------------

    with app.app_context():

        db.create_all()

        # Create default roles

        roles = [
            "Admin",
            "Recruiter",
            "Candidate"
        ]

        for role_name in roles:

            role = Role.query.filter_by(
                name=role_name
            ).first()

            if role is None:

                db.session.add(
                    Role(
                        name=role_name
                    )
                )

        db.session.commit()

    return app