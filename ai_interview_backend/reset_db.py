from database import engine, Base
import models

# This completely drops all existing tables and their data
Base.metadata.drop_all(bind=engine)

# This creates fresh, empty tables based on your updated models
Base.metadata.create_all(bind=engine)

print("All old data wiped! Fresh tables created successfully.")