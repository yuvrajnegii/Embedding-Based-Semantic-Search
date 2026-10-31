from typing import List, Dict
from fastembed import TextEmbedding
import chromadb
from chromadb.config import Settings


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_PATH = "data/chroma_db"
COLLECTION_NAME = "documents"
BATCH_SIZE = 16

_model = None


def _get_model():
    global _model
    if _model is None:
        print(f"\nLoading embedding model: {MODEL_NAME}")
        _model = TextEmbedding(MODEL_NAME)
    return _model

_model = None


def _get_model():
    global _model
    if _model is None:
        print(f"\nLoading embedding model: {MODEL_NAME}")
        _model = TextEmbedding(MODEL_NAME)
    return _model


def embed_and_store(chunks: List[Dict]) -> None:
    """
<<<<<<< HEAD
    Embed each chunk and upsert into ChromaDB.
    Reuses the model and collection already loaded by backend.search.
    Safe to re-run: existing chunk_ids are overwritten.
    """
    from backend.search import _get_model, _get_collection  # lazy import avoids circular import
=======
    Embed each chunk with fastembed and upsert into ChromaDB.
    Safe to re-run — existing chunk_ids are overwritten.
    """
    model = _get_model()
>>>>>>> c62d482 (reuse embedding model and chroma collection on ingest)

    model = _get_model()
    collection = _get_collection()

    total = len(chunks)
    print(f"Embedding {total} chunks in batches of {BATCH_SIZE}...")

    for batch_start in range(0, total, BATCH_SIZE):
        batch = chunks[batch_start : batch_start + BATCH_SIZE]

        texts = [c["text"] for c in batch]
        ids = [c["chunk_id"] for c in batch]
        metadatas = [
            {
                "doc_id": c["doc_id"],
                "filename": c["filename"],
                "source": c["source"],
                "chunk_index": c["chunk_index"],
                "total_chunks": c["total_chunks"],
            }
            for c in batch
        ]

        embeddings = [e.tolist() for e in model.embed(texts)]

        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        done = min(batch_start + BATCH_SIZE, total)
        print(f"  Stored {done}/{total} chunks")

<<<<<<< HEAD
    print(f"Done. Collection now has {collection.count()} entries.")
=======
    print(f"\nDone. Collection '{COLLECTION_NAME}' now has {collection.count()} entries.")
>>>>>>> c62d482 (reuse embedding model and chroma collection on ingest)
