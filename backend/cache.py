# ===== NEW FILE  (create it as backend/cache.py) =====
# What it is: the semantic answer cache (lookup, store, clear, stats).
# ======================================================================

"""
Semantic answer cache for /ask and /ask/stream.

Idea: embed the incoming question and look for an earlier question whose
embedding is very close. If one is found, return its stored answer and sources
instead of retrieving chunks and calling the LLM again.

Design notes
- The cache is a separate ChromaDB collection in its own folder (CACHE_PATH),
  so it never mixes with the document corpus in data/chroma_db.
- Similarity here is TRUE cosine similarity (1 - cosine distance). This is not
  the same scale as the UI score in search.py, which is mapped to [0, 1].
- An entry is only reused when it was produced with the same top_k,
  score_threshold and Groq model. Otherwise the answer could differ.
- clear() must be called whenever the corpus changes (ingest / delete).
"""
import hashlib
import json
import time
from typing import Dict, List, Optional

import chromadb
from chromadb.config import Settings

from backend import config

_client = None
_collection = None
_stats = {"hits": 0, "misses": 0}


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=config.CACHE_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _get_cache():
    global _collection
    if _collection is None:
        _collection = _get_client().get_or_create_collection(
            name=config.CACHE_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def warm() -> None:
    """Open the cache at startup so the first request doesn't pay for it."""
    if config.CACHE_ENABLED:
        _get_cache()


def _settings_key(top_k: int, score_threshold: float) -> str:
    return f"{top_k}|{round(float(score_threshold), 4)}|{config.GROQ_MODEL}"


def _entry_id(query: str, key: str) -> str:
    raw = f"{query.strip().lower()}||{key}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


def lookup(
    query_embedding: List[float],
    top_k: int,
    score_threshold: float,
) -> Optional[Dict]:
    """
    Return a cached entry if a sufficiently similar question was answered
    before, otherwise None.

    The returned dict has: answer, sources_used, retrieved_chunks, model,
    matched_query, similarity.
    """
    if not config.CACHE_ENABLED:
        return None

    cache = _get_cache()
    if cache.count() == 0:
        _stats["misses"] += 1
        return None

    result = cache.query(
        query_embeddings=[query_embedding],
        n_results=1,
        where={"settings": _settings_key(top_k, score_threshold)},
        include=["documents", "distances"],
    )

    if not result["ids"] or not result["ids"][0]:
        _stats["misses"] += 1
        return None

    similarity = 1.0 - result["distances"][0][0]
    if similarity < config.CACHE_THRESHOLD:
        _stats["misses"] += 1
        return None

    payload = json.loads(result["documents"][0][0])
    _stats["hits"] += 1
    return {
        "answer": payload["answer"],
        "sources_used": payload["sources_used"],
        "retrieved_chunks": payload["retrieved_chunks"],
        "model": payload.get("model", config.GROQ_MODEL),
        "matched_query": payload.get("query"),
        "similarity": round(similarity, 4),
    }


def store(
    query: str,
    query_embedding: List[float],
    top_k: int,
    score_threshold: float,
    answer: str,
    sources_used: List[str],
    chunks: List[Dict],
) -> bool:
    """Save a freshly generated answer. Returns True if it was stored."""
    if not config.CACHE_ENABLED:
        return False
    # Never cache empty answers or "nothing found" answers (no chunks retrieved).
    if not answer or not answer.strip() or not chunks:
        return False

    key = _settings_key(top_k, score_threshold)
    payload = {
        "query": query,
        "answer": answer,
        "sources_used": sources_used,
        "retrieved_chunks": chunks,
        "model": config.GROQ_MODEL,
    }

    cache = _get_cache()
    cache.upsert(
        ids=[_entry_id(query, key)],
        embeddings=[query_embedding],
        documents=[json.dumps(payload)],
        metadatas=[{"settings": key, "created_at": time.time()}],
    )
    _evict_if_needed()
    return True


def _evict_if_needed() -> None:
    cache = _get_cache()
    excess = cache.count() - config.CACHE_MAX_ENTRIES
    if excess <= 0:
        return
    data = cache.get(include=["metadatas"])
    oldest = sorted(
        zip(data["ids"], data["metadatas"]),
        key=lambda pair: pair[1].get("created_at", 0.0),
    )[:excess]
    cache.delete(ids=[entry_id for entry_id, _ in oldest])


def clear() -> int:
    """Remove every cached answer. Call after the corpus changes."""
    global _collection
    if not config.CACHE_ENABLED:
        return 0
    removed = 0
    try:
        removed = _get_cache().count()
        _get_client().delete_collection(config.CACHE_COLLECTION)
    except Exception:
        pass  # nothing to delete
    _collection = None
    return removed


def stats() -> Dict:
    total = _stats["hits"] + _stats["misses"]
    entries = _get_cache().count() if config.CACHE_ENABLED else 0
    return {
        "enabled": config.CACHE_ENABLED,
        "entries": entries,
        "hits": _stats["hits"],
        "misses": _stats["misses"],
        "hit_rate": round(_stats["hits"] / total, 4) if total else 0.0,
        "threshold": config.CACHE_THRESHOLD,
    }
