# Embedding-Based Semantic Search

A full-stack semantic search and RAG (Retrieval-Augmented Generation) application. Upload documents, embed them into a vector store, and search or ask questions over them in natural language — with grounded, streamed answers, cited sources, and a semantic cache that serves repeated questions instantly.

## Live Demo

**[Try it here → embedding-based-semantic-search.vercel.app](https://embedding-based-semantic-search.vercel.app/)**

The backend runs on Render's free tier, so if the app has been idle, the first request can take about a minute while the server wakes up. Documents you upload through the demo are not permanent and are cleared when the server restarts. The answer cache is also cleared on restart.

## Overview

Traditional keyword search misses queries that are phrased differently from the source text. This project solves that by embedding both documents and queries into the same vector space using a sentence-embedding model, then retrieving chunks by cosine similarity rather than keyword overlap. Retrieved chunks can either be shown directly (semantic search) or passed to an LLM (Groq) to generate a grounded, cited answer (RAG-style "Ask"). A semantic cache sits in front of "Ask": when a new question means the same thing as one already answered, the stored answer is returned without calling the LLM again.

**Core capabilities:**
- Ingest text via paste, `.txt`, `.pdf`, or `.docx` upload
- Automatic chunking (token-aware, with overlap) and embedding
- Semantic search with adjustable `top_k` and similarity-score threshold
- "Ask" mode: retrieval-augmented answers, including a streaming (SSE) variant
- Semantic answer cache: paraphrased questions are answered instantly, with a "Cached" badge in the UI
- Topic management (list / delete ingested documents)
- Evaluation harnesses: precision/MRR for retrieval, and hit rate / wrong-hit rate / latency for the cache

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion, React Markdown |
| Backend | FastAPI (Python), Pydantic v2 |
| Embeddings | `fastembed` (ONNX Runtime) running `all-MiniLM-L6-v2` |
| Vector store | ChromaDB (persistent, cosine similarity) |
| Answer cache | A second ChromaDB collection holding past questions as embeddings |
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
           │                 │   │  generate, cache)│
           └────────┬────────┘   └───┬──────────────┘
                    │                │
                    ▼                ▼
              ┌───────────────────────────┐
              │   ChromaDB (persistent)    │
              │   data/chroma_db/  (docs)  │
              │   data/cache_db/  (cache)  │
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
│   ├── cache.py           # Semantic answer cache (lookup / store / clear / stats)
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
│   ├── chroma_db/          # Persisted vector store (committed, ships the sample corpus)
│   └── cache_db/           # Answer cache (created at runtime, git-ignored)
├── eval_precision.py       # Precision@5 / Accuracy@1 / MRR evaluation harness
├── eval_cache.py           # Cache hit rate / wrong-hit rate / latency + threshold sweep
├── requirements.txt
├── env.example
└── .gitignore
```

## How It Works

### 1. Ingestion
Text (pasted, or extracted from an uploaded `.txt`/`.pdf`/`.docx`) is split into overlapping chunks using `tiktoken`'s `cl100k_base` encoding — by default **400 tokens per chunk with 80 tokens of overlap** — so context isn't lost at chunk boundaries. Each chunk is tagged with metadata (`doc_id`, `filename`, `source`, `chunk_index`).

### 2. Embedding & Storage
Each chunk is embedded with the `all-MiniLM-L6-v2` model via `fastembed` (ONNX Runtime, no PyTorch required) in batches of 16, and upserted into a persistent ChromaDB collection configured for cosine similarity. Ingestion reuses the embedding model and collection already loaded for search, which keeps memory low on small servers. It is also idempotent — re-running it overwrites existing chunk IDs rather than duplicating them.

### 3. Search
A query is embedded with the same model, and ChromaDB returns the nearest chunks by cosine distance. Distance is converted to a `[0, 1]` similarity score (`1 - distance/2`) so it maps cleanly onto the UI's score bars and threshold slider.

### 4. Ask (RAG)
Retrieved chunks are assembled into a context block and sent to a Groq-hosted model (`openai/gpt-oss-20b` by default) with a system prompt that constrains it to answer **only** from the provided context (and to say so if it can't). `/ask` returns the full answer at once; `/ask/stream` streams it token-by-token over Server-Sent Events, sending retrieved-chunk metadata first so the UI can render source cards immediately.

### 5. Semantic Answer Cache
`/ask` and `/ask/stream` check a cache before retrieving chunks or calling the LLM. The question is embedded once; if an earlier question has cosine similarity of at least `CACHE_THRESHOLD` (default `0.93`), its stored answer and sources are returned immediately and the response is flagged `cached: true`. Otherwise the normal pipeline runs and the finished answer is stored.

```
question -> embed once
   |
   +-> look up a similar past question (same top_k / score threshold / model)
   |
   +-- HIT  -> return stored answer + sources (no LLM call)
   +-- MISS -> retrieve chunks -> Groq -> answer -> store in cache
```

- **Separate store:** the cache lives in its own ChromaDB folder (`data/cache_db`), so it never mixes with the document corpus or gets committed with it.
- **Safe reuse:** an entry is only reused when `top_k`, `score_threshold`, and the Groq model all match.
- **Invalidation:** the cache is cleared whenever a document is ingested or a topic is deleted, so answers never go stale.
- **Failure-tolerant:** a cache error never breaks Ask; it falls back to the normal pipeline.
- **Bounded:** the oldest entries are evicted once `CACHE_MAX_ENTRIES` is exceeded.
- **Switch:** set `CACHE_ENABLED=false` to turn it off without a code change.

On a cache hit the streaming endpoint replays the stored answer in one piece, so it appears at once instead of token by token.

### 6. Topic Management
Ingested documents are tracked by filename stem. `/topics` lists every distinct document currently in the collection; deleting a topic removes all of its chunks from ChromaDB.

## Evaluation

### Retrieval quality
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

The cache sits in front of Ask only, so it does not change retrieval results or these numbers.

### Cache behaviour
`eval_cache.py` stores 20 original questions in a temporary cache, then probes it with 20 paraphrases (which should hit) and 16 different-but-similar questions (which should not). It prints a threshold sweep showing paraphrase hit rate against wrong hits at each cutoff, the closest near-misses, and the latency of a cache hit. With `--groq N` it also times N real cache misses for comparison.

```bash
python eval_cache.py            # stop the backend first; two processes shouldn't share a Chroma folder
python eval_cache.py --groq 5
```

The probe set is small and hand-written, so treat the results as a guide for choosing `CACHE_THRESHOLD`, not as a benchmark.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service message, active Groq model, cache on/off |
| `GET` | `/health` | Collection stats + readiness check |
| `GET` | `/cache/stats` | Cache entries, hits, misses, hit rate, threshold |
| `POST` | `/search` | Semantic search — returns scored chunks |
| `POST` | `/ask` | RAG answer generation (blocking); response includes `cached` and `cache_similarity` |
| `POST` | `/ask/stream` | RAG answer generation (SSE streaming); the metadata event includes `cached` |
| `POST` | `/ingest/text` | Ingest pasted text under a title (clears the cache) |
| `POST` | `/ingest/file` | Ingest an uploaded `.pdf` / `.txt` / `.docx` (max 20 MB; clears the cache) |
| `GET` | `/topics` | List all ingested topics/documents |
| `DELETE` | `/topics/{topic_name}` | Delete a topic and all its chunks (clears the cache) |

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

cp env.example .env             # Windows: copy env.example .env  -- then fill in GROQ_API_KEY

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
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS allow-list (comma-separated, no trailing slashes) |
| `CHROMA_PATH` | `data/chroma_db` | ChromaDB persistence directory |
| `COLLECTION_NAME` | `documents` | ChromaDB collection name |
| `DEFAULT_TOP_K` | `5` | Default number of chunks retrieved |
| `DEFAULT_SCORE_THRESHOLD` | `0.0` | Default minimum similarity score |
| `CACHE_ENABLED` | `true` | Turn the semantic cache on or off |
| `CACHE_PATH` | `data/cache_db` | Cache persistence directory |
| `CACHE_COLLECTION` | `answer_cache` | Cache collection name |
| `CACHE_THRESHOLD` | `0.93` | Minimum cosine similarity between questions for a cache hit |
| `CACHE_MAX_ENTRIES` | `500` | Oldest cache entries are evicted beyond this |

### Loading the Sample Corpus

`data/raw/` ships with three sample topic documents (AI, climate change, quantum computing). Ingest them via the `/ingest/file` endpoint or the frontend's upload UI to populate the vector store before searching.

## Deployment (Free Tier)

The embedder uses `fastembed` instead of PyTorch so the backend fits in the 512 MB of RAM that free hosts provide.

**Backend (Render free web service)**
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `GROQ_API_KEY`, `GROQ_MODEL`, `ALLOWED_ORIGINS` (set to your frontend URL), `PYTHON_VERSION=3.11.9`. The `CACHE_*` variables are optional.
- Commit `data/chroma_db/` so the sample corpus is available on every deploy. Do not commit `data/cache_db/`.
- CORS also accepts any `*.vercel.app` origin through a regex in `backend/main.py`; tighten it to your project name if you want a stricter policy.

**Frontend (Netlify, Cloudflare Pages, or Vercel)**
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL` set to your backend URL (no trailing slash)

**Free-tier limitations**
- Free web services sleep after 15 minutes of inactivity, so the first request afterward takes about a minute.
- Disk storage is ephemeral: documents ingested through the UI, and cached answers, are lost on restart. Only what is committed in `data/chroma_db/` persists. To keep uploads, attach a persistent disk and point `CHROMA_PATH` at it.
- The API is public with no authentication or rate limiting; anyone with the URL can use your Groq quota or delete topics.

## Notes

- Re-ingesting a document with the same title/filename overwrites its existing chunks rather than duplicating them.
- Scanned/image-only PDFs aren't supported — text extraction requires a text layer (no OCR).
- Groq retires models periodically. If `/ask` returns a `model_not_found` error, set `GROQ_MODEL` to a current model from [Groq's supported models list](https://console.groq.com/docs/models).
- If an answer ever looks wrong or stale, set `CACHE_ENABLED=false` to rule out the cache.
- Never commit `.env`; it holds your API key. It is listed in `.gitignore`.
