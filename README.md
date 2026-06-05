# KRR — Knowledge Repository & Review

> AI-powered research paper management. Upload PDFs, auto-extract metadata, generate structured summaries and literature reviews using Groq LLMs. Chat with your papers via RAG.

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-FF4500)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## Features

| Feature | Description |
|---|---|
| **PDF Upload** | Drag-drop upload, auto-extract title / authors / abstract |
| **AI Summary** | Structured: contributions, methodology, results, limitations |
| **Comparative Analysis** | Side-by-side comparison table + thematic synthesis |
| **Synthetic Review** | Full literature review from N papers |
| **Semantic Search** | Vector similarity search across your library (pgvector) |
| **RAG Chat** | Ask questions, get answers grounded in the paper's text |
| **Citation Export** | BibTeX / APA / MLA from extracted metadata |
| **SSE Streaming** | Real-time processing status via Server-Sent Events |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              Next.js 14  (localhost:3000)               │
└────────────────────────┬────────────────────────────────┘
                         │ REST + SSE
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend  (localhost:8000)           │
│                                                         │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  routes/ │  │  services/  │  │  models/           │ │
│  │  papers  │  │  paper_svc  │  │  user, paper,      │ │
│  │  analysis│  │  analysis_  │  │  analysis          │ │
│  │  auth    │  │  svc        │  │                    │ │
│  └──────────┘  │  groq_svc   │  └────────────────────┘ │
│                │  pdf_svc    │                          │
│                └──────┬──────┘                          │
└───────────────────────┼─────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌────────▼────────┐           ┌────────▼────────┐
│   PostgreSQL    │           │   Groq API      │
│   + pgvector    │           │   LLaMA 3.3 70B │
│   (port 5432)   │           │   (free tier)   │
└─────────────────┘           └─────────────────┘
```

---

## Quick Start — Docker (recommended)

```bash
git clone https://github.com/yourusername/KRR-APP.git
cd KRR-APP

# Copy env files
cp backend/.env.example backend/.env
# Fill in GROQ_API_KEY in backend/.env

docker compose up --build
```

App runs at **http://localhost:3000**

---

## Manual Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with pgvector extension

### 1. PostgreSQL + pgvector

```bash
# Docker (easiest):
docker run --name krr-pg \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16

docker exec krr-pg psql -U postgres -c "CREATE DATABASE krrdb;"
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # fill GROQ_API_KEY
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # fill NEXT_PUBLIC_API_URL
npm run dev
```

---

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `GROQ_API_KEY` | Groq API key (free at console.groq.com) | `gsk_...` |
| `AUTH_PASSWORD` | Legacy password gate | `mypassword` |
| `SECRET_KEY` | JWT signing secret (change in prod!) | `random-secret` |
| `DATABASE_URL` | Async PostgreSQL DSN | `postgresql+asyncpg://postgres:pass@localhost/krrdb` |
| `UPLOAD_DIR` | Where PDFs are stored | `./uploads` |

### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL | `http://localhost:8000` |

---

## API Reference

```
POST   /api/auth/register            Register new user
POST   /api/auth/login               Login → {token, email}
GET    /api/auth/me                  Current user info
POST   /api/auth/change-password     Change password

GET    /api/papers?page=1&limit=20&q=transformer   List papers (paginated + search)
POST   /api/papers/upload            Upload PDF (multipart)
GET    /api/papers/{id}              Paper detail + summary
DELETE /api/papers/{id}              Delete paper
POST   /api/papers/{id}/summarize    Re-trigger AI summary
GET    /api/papers/{id}/stream       SSE stream for processing status
GET    /api/papers/{id}/cite?format=bibtex|apa|mla  Citation export
POST   /api/papers/{id}/chat         RAG chat with paper

GET    /api/analyses                 List analyses
POST   /api/analyses                 Create comparative or synthetic review
GET    /api/analyses/{id}            Analysis detail

GET    /api/search?q=neural+networks  Semantic vector search

GET    /api/health                   Health check
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Project Structure

```
KRR-APP/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── paper.py
│   │   │   └── analysis.py
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── paper_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── groq_service.py
│   │   │   └── pdf_service.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── papers.py
│   │       └── analysis.py
│   ├── tests/
│   ├── alembic/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.11 |
| Database | PostgreSQL 16 + pgvector |
| ORM | SQLAlchemy 2 (async) |
| PDF | pdfplumber |
| LLM | Groq — LLaMA 3.3 70B Versatile |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| Auth | JWT (python-jose + bcrypt) |
| Containerization | Docker + Docker Compose |

---

## License

MIT
