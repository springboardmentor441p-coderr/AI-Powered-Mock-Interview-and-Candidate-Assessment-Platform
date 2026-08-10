import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://swathikavasuki_db_user:KgdUPYg5a7K4OaFB@cluster0.t3obdko.mongodb.net/?appName=Cluster0")
DB_NAME = "smarthire"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def get_db():
    """FastAPI dependency — yields the MongoDB database instance."""
    yield db

def init_db():
    """Initialize collections or indexes if necessary."""
    try:
        db.users.create_index("email", unique=True)
        db.candidates.create_index("email", unique=True)
        print("[MongoDB] Database initialized.")
    except Exception as e:
        print(f"[MongoDB] Init error: {e}")
