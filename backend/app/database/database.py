from app.extensions import db


def initialize_database(app):

    with app.app_context():

        db.create_all()

        print("=" * 50)
        print(" SmartHire AI Database Initialized ")
        print("=" * 50)