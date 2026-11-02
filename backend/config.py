# ===== UPDATED FILE  (replace the whole of backend/config.py) =====
# What changed: new CACHE_* settings at the bottom. Everything above is the same.
# ======================================================================

import os
from dotenv import load_dotenv

load_dotenv()

# Embedding / vector store
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_PATH = os.getenv("CHROMA_PATH", "data/chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

# Search defaults
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", "5"))
DEFAULT_SCORE_THRESHOLD = float(os.getenv("DEFAULT_SCORE_THRESHOLD", "0.0"))

# CORS - frontend origin(s) allowed to call this API
ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

# Groq API key, used for answer generation (/ask and /ask/stream)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Semantic answer cache
# The cache lives in its own folder so it never gets committed with the corpus.
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").strip().lower() in ("1", "true", "yes", "on")
CACHE_PATH = os.getenv("CACHE_PATH", "data/cache_db")
CACHE_COLLECTION = os.getenv("CACHE_COLLECTION", "answer_cache")
# Minimum cosine similarity between two questions for a cached answer to be reused.
CACHE_THRESHOLD = float(os.getenv("CACHE_THRESHOLD", "0.93"))
# Oldest entries are evicted once the cache grows past this size.
CACHE_MAX_ENTRIES = int(os.getenv("CACHE_MAX_ENTRIES", "500"))
