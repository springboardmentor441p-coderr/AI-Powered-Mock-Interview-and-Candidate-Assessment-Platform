from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate



# Database
db = SQLAlchemy()


# Database Migration
migrate = Migrate()


# JWT Authentication
jwt = JWTManager()


# Cross Origin Resource Sharing
cors = CORS()


# Password Hashing
bcrypt = Bcrypt()