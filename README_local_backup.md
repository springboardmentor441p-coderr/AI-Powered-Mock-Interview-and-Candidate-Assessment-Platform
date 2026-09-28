# SmartHire AI

## Overview
SmartHire AI is an AI-powered mock interview and candidate assessment platform for students and job seekers.

## Project Structure
- backend/: FastAPI application and API routes
- frontend/: React + Vite client

## Milestones
1. Authentication and database setup
2. Resume upload and interview engine
3. Speech, emotion, and eye-tracking analysis
4. Analytics dashboard and deployment

## Quick Start
### Backend
- pip install fastapi uvicorn sqlalchemy pyjwt python-dotenv
- uvicorn backend.main:app --reload

### Frontend
- cd frontend
- npm install
- npm run dev

## Deployment note
The demo uses a lightweight local JSON store for candidate profiles so the project stays small enough for GitHub deployment and easy testing.
