from typing import List, Dict
import tiktoken


def chunk_documents(
    documents: List[Dict],
    chunk_size: int = 400,
    chunk_overlap: int = 80,
) -> List[Dict]:
    """
    Split each document into overlapping token-aware chunks.
    Returns a flat list of chunk dicts, each with metadata.
    """
    enc = tiktoken.get_encoding("cl100k_base")
    all_chunks = []

    for doc in documents:
        chunks = _chunk_text(doc["text"], enc, chunk_size, chunk_overlap)
        for i, chunk_text in enumerate(chunks):
            all_chunks.append({
                "chunk_id": f"{doc['doc_id']}::chunk_{i}",
                "doc_id": doc["doc_id"],
                "filename": doc["filename"],
                "source": doc["source"],
                "text": chunk_text,
                "chunk_index": i,
                "total_chunks": len(chunks),
            })
        print(f"  Chunked: {doc['filename']} → {len(chunks)} chunks")

    print(f"\nTotal chunks produced: {len(all_chunks)}")
    return all_chunks


def _chunk_text(
    text: str,
    enc: tiktoken.Encoding,
    chunk_size: int,
    overlap: int,
) -> List[str]:
    tokens = enc.encode(text)
    chunks = []
    start = 0

    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        if end == len(tokens):
            break
        start += chunk_size - overlap

    return chunks
