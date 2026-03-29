# Respawn Invoicing

Full-stack invoicing + inventory solution.

## Stack
- Backend: Python, FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React + Tailwind + Framer Motion
- Auth: JWT (login required)
- RBAC: admin, manager, staff

## Project Structure
- `backend/` FastAPI API
- `frontend/` React app

## Backend setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app_main:app --reload --port 8000
```

## Frontend setup
```bash
cd frontend
npm install
npm run dev
```

## Seed first admin (example)
After backend starts, create first admin directly in DB or via script.

## API docs
- Swagger: http://127.0.0.1:8000/docs

