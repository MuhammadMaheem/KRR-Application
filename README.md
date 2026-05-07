# KRR Project

AI-powered literature review workspace that ingests PDF papers, extracts structured analysis, compares documents, and generates multi-paper review drafts.

## What This Project Does

KRR provides a full local workflow for research synthesis:

1. Upload a PDF paper.
2. Extract text and metadata with PyMuPDF.
3. Analyze paper content with Groq models.
4. Store analysis in an in-memory library.
5. Compare papers across themes/methods/results.
6. Generate a structured literature review from a user topic.

## Key Features

- PDF upload and extraction pipeline.
- AI analysis output including:
  - key contributions
  - research problem
  - methodology
  - results
  - limitations
  - research gaps
  - keywords
- Dashboard view over current paper library.
- Cross-document comparison matrix.
- Topic-based literature review generation.
- JWT login endpoint (mock credential backend).

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- PyMuPDF (`fitz`)
- Groq Python SDK
- Pydantic / pydantic-settings
- python-jose (JWT)

### Frontend

- React 19 + Vite
- React Router
- Tailwind CSS v4
- Framer Motion
- Lucide React

### Tooling

- Bash startup/setup scripts (`setup.sh`, `start.sh`)
- ESLint (frontend)

## Project Structure

```text
KRR project/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── papers.py         (legacy/unmounted router)
│   │   │   └── review.py         (legacy/unmounted router)
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── models.py
│   │   └── services/
│   │       ├── ai_service.py
│   │       └── pdf_service.py
│   └── uploads/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       └── pages/
├── requirements.txt
├── setup.sh
├── start.sh
└── logs/
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Linux/macOS shell utilities (`bash`, `lsof`, `awk`, `hostname`)

## Environment Variables

Create `.env` in the repo root (or copy from `.env.example`).

Required:

- `GROQ_API_KEY`

Optional backend settings (defaults exist in `backend/app/core/config.py`):

- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `API_V1_STR`

Optional frontend API base (if not using localhost defaults):

- `VITE_API_URL`
- `VITE_API_BASE_URL`

## Quick Start

### 1) Install dependencies

```bash
./setup.sh
```

### 2) Configure env

Edit `.env` and set a valid Groq key:

```env
GROQ_API_KEY=gsk_your_real_key_here
```

### 3) Start backend + frontend together

```bash
./start.sh
```

### 4) Open the app

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Manual Start (Alternative)

From repo root:

```bash
# Terminal 1
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Login (Current Behavior)

The auth route uses a mock credential check in `backend/app/api/auth.py`.

- Email: `test@gmail.com`
- Password: `test123`

On success, the frontend stores JWT token data in `localStorage`.

## API Endpoints

### Auth

- `POST /api/v1/auth/login`
  - Form fields: `username`, `password`
  - Returns: `access_token`, `token_type`

### Papers

- `GET /api/library`
  - Returns all papers currently in memory.

- `POST /api/upload`
  - Multipart: `file` (PDF only)
  - Extracts text, runs AI analysis, stores result.

- `POST /api/compare`
  - JSON: `{ "paper_ids": ["id1", "id2", ...] }`
  - Requires at least 2 valid IDs.

- `POST /api/generate-review`
  - JSON: `{ "topic": "...", "paper_ids": ["id1", ...] }`
  - Returns structured review sections.

## Frontend Pages

- `/` - Login
- `/dashboard` - Paper library overview
- `/upload` - Upload and process PDF
- `/analysis` - Single-paper analysis tabs
- `/comparison` - Multi-paper comparison matrix
- `/topic-input` - Review topic capture
- `/literature-review` - Rendered generated review

## Data Persistence Model

Current storage is in-memory only (`db_papers` in backend runtime).

Implications:

- Data is lost whenever backend restarts.
- No multi-user persistence.
- No database migrations/replication yet.

## Logs

When using `start.sh`, logs are written to:

- `logs/backend.log`
- `logs/frontend.log`

## Known Issues / Limitations

- `requirements.txt` does not include `pydantic-settings`, but `config.py` imports it.
- `backend/app/api/papers.py` and `backend/app/api/review.py` exist but are not mounted in `main.py`.
- Frontend has some hardcoded API calls to `http://localhost:8000` in pages.
- JWT verification dependency exists, but most active routes are not protected.
- No automated tests currently in this repository.

## Troubleshooting

### Backend fails at import time (`pydantic_settings` missing)

Install manually:

```bash
pip install pydantic-settings
```

### Login always fails

Use the mock credentials exactly:

- `test@gmail.com`
- `test123`

### Upload fails with API error

Check:

1. `GROQ_API_KEY` is present and valid.
2. Backend is running on port `8000`.
3. File is a valid PDF.

### No papers available in dashboard/comparison/review

The backend memory was likely reset. Re-upload papers.

## Security Notes

- Do not commit real API keys in `.env`.
- Replace mock auth before production.
- Move secrets to a secure secrets manager in deployment environments.
- Add route-level auth checks to all protected operations.

## Suggested Next Steps

1. Add a persistent database layer (PostgreSQL or SQLite for local first).
2. Protect all write/read routes with JWT dependencies.
3. Consolidate legacy/unmounted routers with active routes.
4. Introduce an API client module in frontend (single base URL source).
5. Add backend and frontend test suites.

## License

No license file is currently present in this repository.
