import os
from dotenv import load_dotenv

load_dotenv()

# Embedding / vector store
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_PATH = os.getenv("CHROMA_PATH", "data/chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")

# Search defaults
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", "5"))
DEFAULT_SCORE_THRESHOLD = float(os.getenv("DEFAULT_SCORE_THRESHOLD", "0.0"))

# CORS - frontend origin(s) allowed to call this API
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# Optional: Groq API key, for a future RAG answer-generation step
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")