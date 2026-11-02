# ===== UPDATED FILE  (replace the whole of backend/search.py) =====
# What changed:
#   1. CHROMA_PATH and COLLECTION_NAME now come from config (were hardcoded)
#   2. New function embed_query()
#   3. search() accepts an optional query_embedding so the question is embedded once
# ======================================================================

import os
from typing import List, Dict, Optional
from fastembed import TextEmbedding
import chromadb
from chromadb.config import Settings

from backend import config

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_PATH = config.CHROMA_PATH
COLLECTION_NAME = config.COLLECTION_NAME

_model: Optional[TextEmbedding] = None
_collection = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        _model = TextEmbedding(MODEL_NAME)
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(
            path=CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def embed_query(query: str) -> List[float]:
    """Embed one query string. Reused by the cache lookup and by search()."""
    model = _get_model()
    return [v.tolist() for v in model.embed([query])][0]


def search(
    query: str,
    top_k: int = 5,
    score_threshold: float = 0.0,
    query_embedding: Optional[List[float]] = None,
) -> List[Dict]:
    """
    Embed the query and return the top_k most similar chunks from ChromaDB.

    If query_embedding is given it is used directly, so a caller that already
    embedded the query (for the semantic cache) doesn't embed it twice.

    ChromaDB returns cosine *distance* (0 = identical, 2 = opposite).
    We convert to a similarity score in [0, 1] where 1 = perfect match,
    so it lines up with the score bars / threshold slider in the UI.
    """
    if not query or not query.strip():
        return []

    collection = _get_collection()

    if query_embedding is None:
        query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    if not results["ids"] or not results["ids"][0]:
        return []

    hits = []
    for i in range(len(results["ids"][0])):
        distance = results["distances"][0][i]
        similarity = 1 - (distance / 2)  # cosine distance -> similarity [0,1]

        if similarity < score_threshold:
            continue

        metadata = results["metadatas"][0][i]
        hits.append({
            "chunk_id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "score": round(similarity, 4),
            "filename": metadata.get("filename"),
            "doc_id": metadata.get("doc_id"),
            "source": metadata.get("source"),
            "chunk_index": metadata.get("chunk_index"),
        })

    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits


def list_topics() -> List[str]:
    """
    Return the distinct list of filenames currently stored in ChromaDB,
    i.e. every topic the corpus can currently answer questions about.
    """
    collection = _get_collection()
    all_metadata = collection.get(include=["metadatas"])["metadatas"]

    filenames = set()
    for meta in all_metadata:
        filename = meta.get("filename")
        if filename:
            stem = os.path.splitext(filename)[0]
            filenames.add(stem.replace("_", " ").title())

    return sorted(filenames)


def delete_topic(topic_display_name: str) -> Dict:
    """
    Delete every chunk belonging to a topic from ChromaDB.
    topic_display_name matches the human-readable name shown in the UI
    (e.g. "Artificial Intelligence" -> filename "artificial_intelligence.txt").
    """
    collection = _get_collection()

    target_stem = topic_display_name.lower().replace(" ", "_")

    all_data = collection.get(include=["metadatas"])
    ids_to_delete = [
        id_
        for id_, meta in zip(all_data["ids"], all_data["metadatas"])
        if meta.get("filename") and os.path.splitext(meta["filename"])[0] == target_stem
    ]

    if not ids_to_delete:
        return {"success": False, "error": f"No chunks found for topic '{topic_display_name}'."}

    collection.delete(ids=ids_to_delete)

    return {"success": True, "topic": topic_display_name, "chunks_removed": len(ids_to_delete)}


def get_collection_stats() -> Dict:
    """Quick health-check helper for the /health endpoint."""
    collection = _get_collection()
    return {
        "collection_name": COLLECTION_NAME,
        "total_chunks": collection.count(),
        "embedding_model": MODEL_NAME,
    }
