# SmartHire AI — Backend

AI-powered mock interview and candidate assessment platform.

---

## Architecture

Clean Architecture + DDD-inspired modular monolith. Every layer has a
single direction of dependency: **View → Service → Repository → ORM**.

```
backend/
├── config/               # Django settings (base/dev/prod), root URLs, Celery
├── core/                 # Cross-cutting: exceptions, responses, permissions,
│                         # pagination, middleware, base service/repository,
│                         # DI container
├── infrastructure/       # External concerns: cache (Redis), storage (local/S3),
│                         # queue (Celery), monitoring (Sentry), email providers
├── apps/
│   ├── identity/         # Auth (JWT + OAuth2), RBAC, user management
│   │   ├── models/       # user.py, role.py, organization.py
│   │   ├── repositories/ # interfaces.py, user_repository.py
│   │   ├── services/     # auth_service.py, user_service.py
│   │   ├── selectors/    # user_selector.py  (read-only queries)
│   │   └── api/          # serializers/, views/, urls.py
│   │
│   ├── candidate/        # Candidate profiles
│   │   ├── models/       # candidate_profile.py
│   │   ├── repositories/ # candidate_repository.py
│   │   ├── services/     # profile_service.py
│   │   └── api/
│   │
│   ├── resume/           # Upload → Parse → Extract → Summarise pipeline
│   │   ├── models/       # resume.py, extracted_skill.py
│   │   ├── repositories/ # resume_repository.py
│   │   ├── services/     # upload_service.py, parsing_service.py,
│   │   │                 # extraction_service.py, summary_service.py
│   │   ├── providers/    # mock_extractor.py, openai_extractor.py,
│   │   │                 # gemini_extractor.py (template)
│   │   ├── tasks/        # resume_tasks.py  (Celery)
│   │   └── api/
│   │
│   ├── interview/        # Templates, question generation, session lifecycle
│   │   ├── models/       # interview_template.py, question.py,
│   │   │                 # session.py, answer.py
│   │   ├── services/     # session_service.py
│   │   ├── selectors/    # session_selector.py
│   │   └── api/
│   │
│   ├── assessment/       # Speech analysis, rubric scoring, feedback
│   │   ├── models/       # speech_analysis.py, communication_score.py,
│   │   │                 # confidence_score.py, technical_score.py,
│   │   │                 # professionalism_score.py, final_score.py,
│   │   │                 # session_feedback.py
│   │   ├── strategies/   # communication_strategy.py, confidence_strategy.py,
│   │   │                 # technical_strategy.py, professionalism_strategy.py
│   │   ├── services/     # speech_analysis_service.py, scoring_service.py,
│   │   │                 # feedback_service.py
│   │   ├── tasks/        # scoring_tasks.py  (async pipeline)
│   │   └── api/
│   │
│   ├── analytics/        # Read-only aggregations / dashboards
│   │   ├── selectors/    # analytics_selector.py  (cross-domain queries)
│   │   ├── services/     # dashboard_service.py, report_service.py
│   │   └── api/
│   │
│   ├── notification/     # In-app notifications + email dispatch
│   │   ├── models/       # notification.py
│   │   ├── providers/    # interfaces.py, smtp.py, sendgrid.py
│   │   ├── services/     # email_service.py, reminder_service.py
│   │   ├── tasks/        # reminder_tasks.py  (Celery beat)
│   │   └── api/
│   │
│   └── ai/               # AI ports and adapters (no business logic here)
│       ├── providers/
│       │   ├── speech/   # interfaces.py, mock_provider.py, whisper_provider.py
│       │   ├── emotion/  # interfaces.py, mock_provider.py, deepface_provider.py
│       │   ├── eye_tracking/ # interfaces.py, mock_provider.py, mediapipe_provider.py
│       │   └── llm/      # interfaces.py, mock_question_generator.py,
│       │                 # openai_question_generator.py, mock_feedback_generator.py,
│       │                 # openai_feedback_generator.py
│       └── factories/    # provider_factory.py  (maps config → adapter)
│
├── tests/
│   ├── unit/             # test_scoring.py
│   └── integration/      # test_auth.py
│
├── docker/
│   ├── django/Dockerfile
│   ├── nginx/nginx.conf
│   └── postgres/init.sql
│
└── scripts/
    ├── create_superuser.py
    └── seed_demo_data.py
```

---

## SOLID & Design Patterns

| Principle | Where applied |
|---|---|
| **SRP** | `UploadService`, `ParsingService`, `ExtractionService`, `SummaryService` each own one step of the resume pipeline |
| **OCP** | New AI providers plug into existing `IXxxProvider` interfaces without changing services |
| **LSP** | Every `Mock*Provider` / `OpenAI*Provider` pair is fully interchangeable behind its interface |
| **ISP** | `ISpeechToTextProvider`, `IEmotionDetectionProvider`, `IEyeContactTrackingProvider`, `IQuestionGenerationProvider`, etc. — each narrow and purpose-specific |
| **DIP** | Services depend on abstract interfaces; `core/container.py` + `AIProviderFactory` are the only places that import concrete adapters |
| **Strategy** | `CommunicationStrategy`, `ConfidenceStrategy`, `TechnicalStrategy`, `ProfessionalismStrategy` — one file per rubric category, injected into `ScoringService` |
| **Repository** | `UserRepository`, `ResumeRepository`, `CandidateProfileRepository` — the only ORM query sites for their domain |
| **Factory** | `AIProviderFactory` maps `AI_SERVICE_PROVIDER` setting to concrete adapters |
| **CQRS-ish** | `selectors/` (read) vs `services/` (write) in every domain app |

---

## Request Flow

```
HTTP Request
    ↓
DRF View  (HTTP parsing only — no business logic)
    ↓
Serializer  (validation / shape)
    ↓
Service  (business logic, transactional boundaries)
    ↓
Repository  (the only place that touches ORM directly)
    ↓
PostgreSQL
```

## AI Pipeline Flow

```
Session completed
    ↓
Celery task: run_assessment_pipeline
    ↓
SpeechAnalysisService
    ├── ISpeechToTextProvider    → transcript
    ├── ICommunicationAnalysisProvider → grammar, pace, filler words
    ├── IEmotionDetectionProvider → emotion, confidence
    └── IEyeContactTrackingProvider → eye contact, attention
    ↓
ScoringService
    ├── CommunicationStrategy  × 30%
    ├── ConfidenceStrategy     × 25%
    ├── TechnicalStrategy      × 30%
    └── ProfessionalismStrategy × 15%
    ↓
FeedbackService → IFeedbackGenerationProvider
    ↓
NotificationService → IEmailProvider (SMTP / SendGrid)
```

---

## Switching AI Providers

Set `AI_SERVICE_PROVIDER=mock` (default — zero dependencies, deterministic) or
`AI_SERVICE_PROVIDER=openai` in `.env`. `AIProviderFactory` in
`apps/ai/factories/provider_factory.py` is the only file that changes.
No service, serializer, or view needs editing.

Same pattern for email: `EMAIL_PROVIDER=smtp` (default) or `EMAIL_PROVIDER=sendgrid`.

---

## What uses Django built-ins instead of custom code

- **Auth**: `AbstractBaseUser` + `PermissionsMixin` + `djangorestframework-simplejwt` (JWT, refresh, blacklist) + `social-auth-app-django` (Google OAuth2)
- **Admin**: Standard Django admin extended with `UserAdmin` — no custom admin UI
- **Password hashing/validation**: Django's built-in validators and `set_password`/`check_password`
- **Email**: Django's `send_mail` / `EMAIL_BACKEND` — the SMTP provider is a one-liner wrapper
- **ORM, migrations, transactions**: standard Django throughout

---

## Local Setup

```bash
git clone <repo>
cd backend
cp .env.example .env          # edit as needed
python -m venv .venv && source .venv/bin/activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py shell < scripts/seed_demo_data.py
python manage.py runserver
```

Async pipeline (separate terminal):
```bash
celery -A config worker --loglevel=info
```

Periodic reminders (separate terminal):
```bash
celery -A config beat --loglevel=info
```

---

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Starts: PostgreSQL, Redis, Django (gunicorn), Nginx, Celery worker, Celery beat.

---

## Tests

```bash
pytest
```

---

## API Docs

| URL | Description |
|---|---|
| `/api/docs/` | Swagger UI |
| `/api/redoc/` | ReDoc |
| `/api/schema/` | OpenAPI 3 schema |
| `/admin/` | Django admin |

## Key Endpoints

| Method | URL | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register candidate or recruiter |
| POST | `/api/v1/auth/login/` | Obtain JWT tokens |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/v1/auth/me/` | Current user profile |
| GET/PATCH | `/api/v1/candidates/profile/` | Candidate profile |
| POST | `/api/v1/resumes/upload/` | Upload resume (triggers async AI extraction) |
| GET | `/api/v1/resumes/` | List candidate resumes |
| POST | `/api/v1/interviews/sessions/create/` | Create session (AI question generation) |
| POST | `/api/v1/interviews/sessions/{id}/start/` | Start session |
| POST | `/api/v1/interviews/sessions/{id}/answer/` | Submit answer |
| POST | `/api/v1/interviews/sessions/{id}/complete/` | Complete → triggers assessment pipeline |
| GET | `/api/v1/assessments/sessions/{id}/analysis/` | Speech analysis results |
| GET | `/api/v1/assessments/sessions/{id}/score/` | Final weighted score |
| GET | `/api/v1/assessments/sessions/{id}/feedback/` | AI-generated feedback |
| GET | `/api/v1/analytics/candidate/dashboard/` | Full candidate dashboard |
| GET | `/api/v1/analytics/recruiter/rankings/` | Candidate rankings |
| GET | `/api/v1/analytics/recruiter/overview/` | Platform overview |
| GET | `/api/v1/notifications/` | List notifications |
| POST | `/api/v1/notifications/read-all/` | Mark all as read |
