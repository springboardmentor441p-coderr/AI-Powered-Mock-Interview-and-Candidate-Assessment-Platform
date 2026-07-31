"""
Models Package

This file makes the models directory a Python package.
It also imports all database models so Flask-Migrate can detect them.
"""

from .role import Role
from .user import User
from .resume import Resume
from .interview import Interview
from .question import Question
from .answer import Answer
from .score import Score
from .report import Report
