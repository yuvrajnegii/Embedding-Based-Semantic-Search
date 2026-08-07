import re
from typing import Dict

from ingestion.chunker import chunk_documents
from ingestion.embedder import embed_and_store


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "document"


def ingest_paste(
    title: str,
    text: str,
    chunk_size: int = 400,
    chunk_overlap: int = 80,
) -> Dict:
    """
    Ingest user-supplied plain text under a title, chunk it, embed it, and
    store it in ChromaDB — mirrors file_ingest.ingest_pdf_bytes() but takes
    raw text instead of a PDF.
    """
    if not title or not title.strip():
        return {"success": False, "error": "Please provide a title."}

    if not text or not text.strip():
        return {"success": False, "error": "Please paste some text first."}

    doc_id = _slugify(title)
    display_name = title.strip()

    document = {
        "doc_id": doc_id,
        "filename": f"{doc_id}.txt",
        "text": text,
        "source": f"paste:{doc_id}",
    }

    chunks = chunk_documents([document], chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    embed_and_store(chunks)

    return {
        "success": True,
        "topic": display_name,
        "chunks_added": len(chunks),
    }
