"""
Authentication forms.
"""
from flask_wtf import FlaskForm
from wtforms import PasswordField, SelectField, StringField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError

from app.models import User
from app.utils.constants import ROLES


class RegistrationForm(FlaskForm):
    """User registration form."""

    full_name = StringField(
        "Full Name",
        validators=[DataRequired(), Length(min=2, max=150)],
    )
    username = StringField(
        "Username",
        validators=[DataRequired(), Length(min=3, max=80)],
    )
    email = StringField(
        "Email",
        validators=[DataRequired(), Email(), Length(max=120)],
    )
    password = PasswordField(
        "Password",
        validators=[DataRequired(), Length(min=6, max=128)],
    )
    confirm_password = PasswordField(
        "Confirm Password",
        validators=[DataRequired(), EqualTo("password", message="Passwords must match")],
    )
    role = SelectField(
        "Register As",
        choices=[(r, r.title()) for r in ROLES if r != "admin"],
        validators=[DataRequired()],
    )
    submit = SubmitField("Register")

    def validate_username(self, field) -> None:
        """Ensure username is unique."""
        if User.query.filter_by(username=field.data).first():
            raise ValidationError("Username already taken.")

    def validate_email(self, field) -> None:
        """Ensure email is unique."""
        if User.query.filter_by(email=field.data.lower()).first():
            raise ValidationError("Email already registered.")


class LoginForm(FlaskForm):
    """User login form."""

    email = StringField(
        "Email or Username",
        validators=[DataRequired()],
    )
    password = PasswordField(
        "Password",
        validators=[DataRequired()],
    )
    submit = SubmitField("Login")
