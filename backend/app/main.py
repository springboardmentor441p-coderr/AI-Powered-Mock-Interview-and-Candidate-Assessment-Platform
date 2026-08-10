from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.auth_controller import router as auth_router
from app.controllers.resume_controller import router as resume_router
from app.controllers.candidate_controller import router as candidate_router
from app.controllers.interview_controller import router as interview_router
from app.controllers.coding_controller import router as coding_router
from app.controllers.admin_controller import router as admin_router
from app.core.config import get_settings
from app.database.base import Base
from app.database.session import engine
from app.middleware.auth import JWTAuthenticationMiddleware
from app.models import user as user_model  # noqa: F401
from app.models import resume as resume_model  # noqa: F401
from app.models import candidate_profile as candidate_profile_model  # noqa: F401
from app.models import interview as interview_model  # noqa: F401
from app.models import coding as coding_model  # noqa: F401

settings = get_settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTAuthenticationMiddleware)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(resume_router, prefix=settings.api_v1_prefix)
app.include_router(candidate_router, prefix=settings.api_v1_prefix)
app.include_router(interview_router, prefix=settings.api_v1_prefix)
app.include_router(coding_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

