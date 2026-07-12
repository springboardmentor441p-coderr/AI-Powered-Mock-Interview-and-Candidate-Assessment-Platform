"""
Flask extensions initialization.
"""
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
login_manager = LoginManager()
csrf = CSRFProtect()
