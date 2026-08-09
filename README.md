# Intervio AI Application

This project is separated into clean `frontend` and `backend` directories.

## Project Structure

```
.
├── frontend/             # Next.js React frontend web application
│   ├── src/              # Pages, components, styles, and context
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies & scripts
│   └── tsconfig.json     # TypeScript configuration
├── backend/              # Node.js / Express backend service
│   ├── src/              # Express server & API route handlers
│   ├── package.json      # Backend dependencies & scripts
│   └── tsconfig.json     # TypeScript configuration
└── package.json          # Root workspace configuration
```

## Running the Application

### 1. Frontend (Next.js)
```bash
# Navigate into the frontend folder
cd frontend

# Run development server
npm run dev
```
Or from the root directory:
```bash
npm run dev:frontend
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the frontend interface.

---

### 2. Backend (Express & Node.js)
```bash
# Navigate into the backend folder
cd backend

# Install dependencies (first time only)
npm install

# Run backend development server
npm run dev
```
Or from the root directory:
```bash
npm run dev:backend
```
The API server runs on [http://localhost:5000](http://localhost:5000).

---

## Deployment & Building

- **Frontend build**: `npm --prefix frontend run build`
- **Backend build**: `npm --prefix backend run build`
