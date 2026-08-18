from app.database import engine, Base
import app.models.models # ensure models are registered

print("Dropping all existing database tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all database tables with latest models schema...")
Base.metadata.create_all(bind=engine)
print("Database schema successfully recreated!")
