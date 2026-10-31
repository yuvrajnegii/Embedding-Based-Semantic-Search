# Embedding-Based Semantic Search

A full-stack semantic search and RAG (Retrieval-Augmented Generation) application. Upload documents, embed them into a vector store, and search or ask questions over them in natural language — with grounded, streamed answers and cited sources.

## Live Demo

**[Try it here → embedding-based-semantic-search.vercel.app](https://embedding-based-semantic-search.vercel.app/)**
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://embedding-based-semantic-search.vercel.app/)

The backend runs on Render's free tier, so if the app has been idle, the first request can take about a minute while the server wakes up. Documents you upload through the demo are not permanent and are cleared when the server restarts.

## Overview

Traditional keyword search misses queries that are phrased differently from the source text. This project solves that by embedding both documents and queries into the same vector space using a sentence-embedding model, then retrieving chunks by cosine similarity rather than keyword overlap. Retrieved chunks can either be shown directly (semantic search) or passed to an LLM (Groq) to generate a grounded, cited answer (RAG-style "Ask").

**Core capabilities:**
- Ingest text via paste, `.txt`, `.pdf`, or `.docx` upload
- Automatic chunking (token-aware, with overlap) and embedding
- Semantic search with adjustable `top_k` and similarity-score threshold
- "Ask" mode: retrieval-augmented answers, including a streaming (SSE) variant
- Topic management (list / delete ingested documents)
- A precision/MRR evaluation harness against a labeled query set

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion, React Markdown |
| Backend | FastAPI (Python), Pydantic v2 |
| Embeddings | `fastembed` (ONNX Runtime) running `all-MiniLM-L6-v2` |
| Vector store | ChromaDB (persistent, cosine similarity) |
| Chunking | `tiktoken` (`cl100k_base` token-aware splitting) |
| Answer generation | Groq API (`openai/gpt-oss-20b` by default, configurable via `GROQ_MODEL`) |
| File parsing | PyMuPDF (PDF), `python-docx` (DOCX) |

## Architecture

```
                    ┌─────────────────────┐
                    │   React Frontend     │
                    │  (search / ask / UI) │
                    └──────────┬───────────┘
                               │ REST + SSE
                    ┌──────────▼───────────┐
                    │   FastAPI Backend     │
                    │  (backend/main.py)    │
                    └───┬───────────┬───────┘
                        │           │
           ┌────────────▼───┐   ┌───▼─────────────┐
           │ Ingestion       │   │ Search/RAG       │
           │ (chunk + embed) │   │ (backend/search, │
           │                 │   │  backend/generate)│
           └────────┬────────┘   └───┬──────────────┘
                    │                │
                    ▼                ▼
              ┌───────────────────────────┐
              │   ChromaDB (persistent)    │
              │   data/chroma_db/          │
              └───────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Groq API (LLM)       │
                    │  answer generation    │
                    └───────────────────────┘
```

## Project Structure

```
embedding1/
├── backend/
│   ├── main.py            # FastAPI app & routes
│   ├── config.py          # Env-driven configuration
│   ├── models.py          # Pydantic request/response schemas
│   ├── search.py          # Query embedding (fastembed) + ChromaDB retrieval, topic list/delete
│   ├── generate.py        # Groq-based answer generation (sync + streaming)
│   ├── file_ingest.py     # PDF/DOCX/TXT upload → text extraction → ingest
│   └── paste_ingest.py    # Pasted-text ingest
├── ingestion/
│   ├── chunker.py         # Token-aware overlapping chunking (tiktoken)
│   └── embedder.py        # Batch embedding (fastembed) + upsert into ChromaDB
├── frontend/
│   ├── src/
│   │   ├── components/    # SearchBar, ResultCard, AnswerCard, TopicList, UploadFile, etc.
│   │   ├── api.js         # Fetch wrappers for /search, /ask, /ask/stream, /ingest, /topics
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── data/
│   ├── raw/                # Source corpus (AI, climate change, quantum computing .txt files)
│   └── chroma_db/          # Persisted vector store
├── eval_precision.py       # Precision@5 / Accuracy@1 / MRR evaluation harness
├── requirements.txt
└── env.example
```

## How It Works

### 1. Ingestion
Text (pasted, or extracted from an uploaded `.txt`/`.pdf`/`.docx`) is split into overlapping chunks using `tiktoken`'s `cl100k_base` encoding — by default **400 tokens per chunk with 80 tokens of overlap** — so context isn't lost at chunk boundaries. Each chunk is tagged with metadata (`doc_id`, `filename`, `source`, `chunk_index`).

### 2. Embedding & Storage
Each chunk is embedded with the `all-MiniLM-L6-v2` model via `fastembed` (ONNX Runtime, no PyTorch required) in batches of 64, and upserted into a persistent ChromaDB collection configured for cosine similarity. Ingestion is idempotent — re-running it overwrites existing chunk IDs rather than duplicating them.

### 3. Search
A query is embedded with the same model, and ChromaDB returns the nearest chunks by cosine distance. Distance is converted to a `[0, 1]` similarity score (`1 - distance/2`) so it maps cleanly onto the UI's score bars and threshold slider.

### 4. Ask (RAG)
Retrieved chunks are assembled into a context block and sent to a Groq-hosted model (`openai/gpt-oss-20b` by default) with a system prompt that constrains it to answer **only** from the provided context (and to say so if it can't). `/ask` returns the full answer at once; `/ask/stream` streams it token-by-token over Server-Sent Events, sending retrieved-chunk metadata first so the UI can render source cards immediately.

### 5. Topic Management
Ingested documents are tracked by filename stem. `/topics` lists every distinct document currently in the collection; deleting a topic removes all of its chunks from ChromaDB.

## Evaluation

`eval_precision.py` runs 60 hand-labeled queries through the real search pipeline (top-5 retrieval) against the 353-chunk sample corpus. Each query is labeled with the topic document(s) considered relevant, and a retrieved chunk counts as a hit if it comes from a relevant topic (topic-level relevance).

| Metric | Score |
|---|---|
| Precision@5 | **0.893** |
| Accuracy@1 | 0.933 |
| MRR | 0.958 |

| Breakdown | Precision@5 |
|---|---|
| AI (n=19) | 0.937 |
| Climate (n=20) | 0.840 |
| Quantum (n=21) | 0.905 |
| Easy (n=19) | 0.979 |
| Medium (n=33) | 0.818 |
| Hard, cross-topic (n=8) | 1.000 |

Run it from the project root:

```bash
python eval_precision.py
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Collection stats + readiness check |
| `POST` | `/search` | Semantic search — returns scored chunks |
| `POST` | `/ask` | RAG answer generation (blocking) |
| `POST` | `/ask/stream` | RAG answer generation (SSE streaming) |
| `POST` | `/ingest/text` | Ingest pasted text under a title |
| `POST` | `/ingest/file` | Ingest an uploaded `.pdf` / `.txt` / `.docx` (max 20 MB) |
| `GET` | `/topics` | List all ingested topics/documents |
| `DELETE` | `/topics/{topic_name}` | Delete a topic and all its chunks |

Interactive docs are available at `/docs` (Swagger UI) once the backend is running.

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (only required for `/ask` and `/ask/stream`)

### Backend

```bash
# from the project root
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp env.example .env             # then fill in GROQ_API_KEY

uvicorn backend.main:app --reload --port 8000
# or: python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default the frontend expects the API at `http://localhost:8000` (override with `VITE_API_URL`).

### Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | Required for `/ask` and `/ask/stream` |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model used for answer generation |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS allow-list |
| `CHROMA_PATH` | `data/chroma_db` | ChromaDB persistence directory |
| `COLLECTION_NAME` | `documents` | ChromaDB collection name |
| `DEFAULT_TOP_K` | `5` | Default number of chunks retrieved |
| `DEFAULT_SCORE_THRESHOLD` | `0.0` | Default minimum similarity score |

### Loading the Sample Corpus

`data/raw/` ships with three sample topic documents (AI, climate change, quantum computing). Ingest them via the `/ingest/file` endpoint or the frontend's upload UI to populate the vector store before searching.

## Deployment (Free Tier)

The embedder uses `fastembed` instead of PyTorch so the backend fits in the 512 MB of RAM that free hosts provide.

**Backend (Render free web service)**
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `GROQ_API_KEY`, `GROQ_MODEL`, `ALLOWED_ORIGINS` (set to your frontend URL), `PYTHON_VERSION=3.11.9`
- Commit `data/chroma_db/` so the sample corpus is available on every deploy.

**Frontend (Netlify, Cloudflare Pages, or Vercel)**
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL` set to your backend URL (no trailing slash)

**Free-tier limitations**
- Free web services sleep after 15 minutes of inactivity, so the first request afterward takes about a minute.
- Disk storage is ephemeral: documents ingested through the UI are lost on restart. Only what is committed in `data/chroma_db/` persists.
- The API is public; anyone with the URL can use your Groq quota.

## Notes

- Re-ingesting a document with the same title/filename overwrites its existing chunks rather than duplicating them.
- Scanned/image-only PDFs aren't supported — text extraction requires a text layer (no OCR).
- Groq retires models periodically. If `/ask` returns a `model_not_found` error, set `GROQ_MODEL` to a current model from [Groq's supported models list](https://console.groq.com/docs/models).
