import re
from pathlib import Path
from typing import Dict

import fitz  # PyMuPDF

from ingestion.chunker import chunk_documents
from ingestion.embedder import embed_and_store

MAX_PDF_BYTES = 20 * 1024 * 1024  # 20 MB


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        return "\n".join(page.get_text() for page in doc)
    finally:
        doc.close()


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "document"


def ingest_pdf_bytes(
    filename: str,
    file_bytes: bytes,
    chunk_size: int = 400,
    chunk_overlap: int = 80,
) -> Dict:
    """
    Extract text from an uploaded PDF, chunk it, embed it, and store it in
    ChromaDB — mirrors topic_ingest.ingest_topic() but for user-uploaded files.
    """
    if len(file_bytes) > MAX_PDF_BYTES:
        return {
            "success": False,
            "error": f"PDF exceeds the {MAX_PDF_BYTES // (1024 * 1024)}MB upload limit.",
        }

    try:
        text = extract_pdf_text(file_bytes)
    except Exception as e:
        return {"success": False, "error": f"Could not read PDF: {e}"}

    if not text.strip():
        return {
            "success": False,
            "error": (
                f"No extractable text found in '{filename}'. "
                "It may be a scanned/image-only PDF (OCR isn't supported yet)."
            ),
        }

    stem = Path(filename).stem
    doc_id = _slugify(stem)
    display_name = stem.replace("_", " ").strip() or filename

    document = {
        "doc_id": doc_id,
        "filename": f"{doc_id}.pdf",
        "text": text,
        "source": f"upload:{filename}",
    }

    chunks = chunk_documents([document], chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    embed_and_store(chunks)

    return {
        "success": True,
        "topic": display_name,
        "chunks_added": len(chunks),
    }
