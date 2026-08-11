import os, json
from datetime import datetime
from pymongo import MongoClient
import certifi
import bson
from dotenv import load_dotenv

try:
    import mongomock
except ImportError:
    mongomock = None

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://swathikap4197sse_db_user:r9IagpVQLVzQ2kma@nexiq-smarthire.sntst6s.mongodb.net/?appName=Nexiq-Smarthire"
)
DB_NAME = os.getenv("DB_NAME", "smarthire")
PERSIST_FILE = os.path.join(os.path.dirname(__file__), "..", "smarthire_persistent_db.json")

is_mock = False
mock_client_ref = None

def _json_serial(obj):
    if isinstance(obj, (datetime, bson.ObjectId)):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

def save_persistent_data():
    global mock_client_ref, is_mock
    if not is_mock or not mock_client_ref:
        return
    try:
        data = {}
        database = mock_client_ref[DB_NAME]
        for col_name in database.list_collection_names():
            col_docs = []
            for doc in database[col_name].find():
                d = dict(doc)
                if "_id" in d:
                    d["_id"] = str(d["_id"])
                col_docs.append(d)
            data[col_name] = col_docs
        with open(PERSIST_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, default=_json_serial, indent=2)
    except Exception as e:
        print(f"[DB Persist Error]: {e}")

def load_persistent_data(client):
    if not os.path.exists(PERSIST_FILE):
        return
    try:
        with open(PERSIST_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        database = client[DB_NAME]
        for col_name, docs in data.items():
            if docs:
                # Remove existing docs in memory before reloading
                database[col_name].delete_many({})
                clean_docs = []
                for d in docs:
                    if "_id" in d and isinstance(d["_id"], str) and len(d["_id"]) == 24:
                        try:
                            d["_id"] = bson.ObjectId(d["_id"])
                        except Exception:
                            pass
                    clean_docs.append(d)
                database[col_name].insert_many(clean_docs)
        print(f"[Persistent DB] Loaded saved user data from disk ({PERSIST_FILE}).")
    except Exception as e:
        print(f"[DB Load Error]: {e}")

def _init_client():
    global is_mock, mock_client_ref
    try:
        client = MongoClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=4000,
        )
        client.admin.command("ping")
        print("[MongoDB] Connected to MongoDB Atlas cloud successfully.")
        return client
    except Exception as e1:
        try:
            client = MongoClient(
                MONGO_URI,
                tls=True,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=4000,
            )
            client.admin.command("ping")
            print("[MongoDB] Connected to MongoDB Atlas cloud (TLS bypass).")
            return client
        except Exception as e2:
            print(f"[MongoDB Info] Atlas handshake: {e2}")
            print("[MongoDB] Using persistent local database storage.")
            if mongomock is None:
                import mongomock  # type: ignore
            is_mock = True
            mock_client_ref = mongomock.MongoClient()
            load_persistent_data(mock_client_ref)
            return mock_client_ref

client = _init_client()
db = client[DB_NAME]

def get_db():
    """FastAPI dependency — yields database and triggers auto-save on mock."""
    try:
        yield db
    finally:
        if is_mock:
            save_persistent_data()

def init_db():
    """Initialize collections or indexes if necessary."""
    try:
        db.users.create_index("email", unique=True)
        db.candidates.create_index("email", unique=True)
        print("[MongoDB] Database initialized.")
    except Exception as e:
        print(f"[MongoDB] Init info: {e}")

