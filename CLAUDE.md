# KRR-APP — Knowledge Repository & Review System

Personal research paper management tool. Upload PDFs, auto-extract content, generate AI summaries and literature reviews using Groq (free tier).

## Tech Stack

| Layer | Tool |
|---|---|
| Backend | FastAPI + Python |
| DB | PostgreSQL + SQLAlchemy (async) |
| PDF | pdfplumber |
| LLM | Groq `llama-3.3-70b-versatile` |
| Frontend | Next.js 14 + TypeScript |
| Auth | X-Auth-Token header (password gate) |

## Project Structure

```
KRR-APP/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── routes/
│   ├── uploads/      # PDF storage (gitignored)
│   ├── alembic/      # DB migrations
│   ├── requirements.txt
│   └── .env
├── frontend/         # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── .env.local
└── test paper/       # Test PDFs
```

## Environment Variables

### backend/.env
```
GROQ_API_KEY=your_groq_api_key_here
AUTH_PASSWORD=your_secret_password
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/krrdb
UPLOAD_DIR=./uploads
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_TOKEN=your_secret_password
```

## Setup

### 1. PostgreSQL
```bash
# Local install or Docker:
docker run --name krr-pg -e POSTGRES_PASSWORD=pass -p 5432:5432 -d postgres
# Create DB:
docker exec -it krr-pg psql -U postgres -c "CREATE DATABASE krrdb;"
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Copy and fill .env
cp .env.example .env
# Run migrations
alembic upgrade head
# Start dev server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
# Copy and fill .env.local
cp .env.local.example .env.local
npm run dev
```

Frontend runs at http://localhost:3000. Backend at http://localhost:8000.

## API Endpoints

```
POST   /api/auth/login             → {token}
GET    /api/papers                 → Paper[]
POST   /api/papers/upload          → Paper  (multipart/form-data, field: file)
GET    /api/papers/{id}            → Paper  (includes content + summary)
DELETE /api/papers/{id}            → 204
POST   /api/papers/{id}/summarize  → Paper  (re-trigger AI summary)
GET    /api/analyses               → Analysis[]
POST   /api/analyses               → Analysis
GET    /api/analyses/{id}          → Analysis
GET    /api/health                 → {status: ok}
```

## Quick Curl Tests

```bash
TOKEN="your_password"
BASE="http://localhost:8000"

# Health check
curl $BASE/api/health

# Login
curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"'$TOKEN'"}' | python3 -m json.tool

# Upload paper
PAPER1=$(curl -s -X POST $BASE/api/papers/upload \
  -H "X-Auth-Token: $TOKEN" \
  -F "file=@test paper/Continuous_Testing_and_Solutions_for_Testing_Probl.pdf" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Poll status
curl -s $BASE/api/papers/$PAPER1 -H "X-Auth-Token: $TOKEN" | python3 -m json.tool

# List papers
curl -s $BASE/api/papers -H "X-Auth-Token: $TOKEN" | python3 -m json.tool
```

## Features

- **PDF Upload** — drag-drop, auto-extract title/authors/abstract/full text
- **AI Summary** — structured: contributions, methodology, results, limitations
- **Comparative Analysis** — side-by-side comparison of N papers
- **Synthetic Review** — full literature review document from N papers

## Groq Models Used

- `llama-3.3-70b-versatile` — summaries, analysis, reviews
- `llama-3.1-8b-instant` — fast fallback for simple tasks

All free tier. No cost.
