# Sense-Cluster

An authenticated semantic Q&A application. The backend uses FastAPI, PostgreSQL with pgvector, Alembic migrations, and a versioned embedding model. The frontend is a small Vite React client. There are two roles: admins manage roles; contributors can ask and answer questions.

## Local start

1. Copy `Backend/.env.example` to `Backend/.env` and set strong local values. The included default uses SQLite for local development; Docker is not required.
2. From `Backend`, install `requirements.txt`, then run `uvicorn app.main:app --reload`. SQLite creates its local database automatically.
3. When you adopt Docker, set the PostgreSQL URL shown in `.env.example`, start `docker compose up -d db`, and run `alembic upgrade head` before starting the API.
4. From `Frontend`, copy `.env.example` to `.env`, run `npm install`, then `npm run dev`.

Never commit `.env` files. Production secrets must be injected by the deployment platform.
