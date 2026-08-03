from typing import List, Dict
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings


MODEL_NAME = "all-MiniLM-L6-v2"
CHROMA_PATH = "data/chroma_db"
COLLECTION_NAME = "documents"
BATCH_SIZE = 64


def embed_and_store(chunks: List[Dict]) -> None:
    """
    Embed each chunk with sentence-transformers and upsert into ChromaDB.
    Safe to re-run — existing chunk_ids are overwritten.
    """
    print(f"\nLoading embedding model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Connecting to ChromaDB at: {CHROMA_PATH}")
    client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    total = len(chunks)
    print(f"Embedding {total} chunks in batches of {BATCH_SIZE}...\n")

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

        embeddings = model.encode(texts, show_progress_bar=False).tolist()

        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        done = min(batch_start + BATCH_SIZE, total)
        print(f"  Stored {done}/{total} chunks")

    print(f"\nDone. Collection '{COLLECTION_NAME}' now has {collection.count()} entries.")
