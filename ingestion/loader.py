import os
from pathlib import Path
from typing import List, Dict

SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}


def load_documents(raw_dir: str = "data/raw") -> List[Dict]:
    """
    Walk the raw directory and return a list of document dicts.
    Each dict has: { "doc_id", "filename", "text", "source" }
    """
    raw_path = Path(raw_dir)
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw data directory not found: {raw_dir}")

    documents = []

    for filepath in sorted(raw_path.rglob("*")):
        if filepath.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        text = _read_file(filepath)
        if not text.strip():
            continue

        documents.append({
            "doc_id": str(filepath.relative_to(raw_path)),
            "filename": filepath.name,
            "text": text,
            "source": str(filepath),
        })
        print(f"  Loaded: {filepath.name} ({len(text)} chars)")

    print(f"\nTotal documents loaded: {len(documents)}")
    return documents


def _read_file(filepath: Path) -> str:
    if filepath.suffix.lower() == ".pdf":
        return _read_pdf(filepath)
    else:
        return filepath.read_text(encoding="utf-8", errors="ignore")


def _read_pdf(filepath: Path) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(filepath))
        return "\n".join(page.get_text() for page in doc)
    except ImportError:
        print("  PyMuPDF not installed. Skipping PDF:", filepath.name)
        print("  Install with: pip install pymupdf")
        return ""
