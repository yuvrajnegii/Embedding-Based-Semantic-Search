from typing import List, Dict

BATCH_SIZE = 16  # smaller batches keep peak memory low on small servers


def embed_and_store(chunks: List[Dict]) -> None:
    """
    Embed each chunk and upsert into ChromaDB.
    Reuses the model and collection already loaded by backend.search.
    Safe to re-run: existing chunk_ids are overwritten.
    """
    # Imported here to avoid a circular import at startup
    from backend.search import _get_model, _get_collection

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

    print(f"Done. Collection now has {collection.count()} entries.")
