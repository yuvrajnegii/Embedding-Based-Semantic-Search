"""
Run the full ingestion pipeline:
  python run_ingest.py

Optional flags:
  --raw-dir   path to raw documents  (default: data/raw)
  --chunk-size   tokens per chunk    (default: 400)
  --overlap      overlap tokens      (default: 80)
"""

import argparse
import time
from ingestion.loader import load_documents
from ingestion.chunker import chunk_documents
from ingestion.embedder import embed_and_store


def main():
    parser = argparse.ArgumentParser(description="Semantic search ingestion pipeline")
    parser.add_argument("--raw-dir", default="data/raw", help="Directory of source documents")
    parser.add_argument("--chunk-size", type=int, default=400, help="Tokens per chunk")
    parser.add_argument("--overlap", type=int, default=80, help="Overlapping tokens between chunks")
    args = parser.parse_args()

    start = time.time()

    print("=" * 50)
    print("STEP 1 — Loading documents")
    print("=" * 50)
    documents = load_documents(raw_dir=args.raw_dir)

    if not documents:
        print("No documents found. Add .txt, .md, or .pdf files to", args.raw_dir)
        return

    print("\n" + "=" * 50)
    print("STEP 2 — Chunking documents")
    print("=" * 50)
    chunks = chunk_documents(
        documents,
        chunk_size=args.chunk_size,
        chunk_overlap=args.overlap,
    )

    print("\n" + "=" * 50)
    print("STEP 3 — Embedding and storing")
    print("=" * 50)
    embed_and_store(chunks)

    elapsed = round(time.time() - start, 1)
    print(f"\nIngestion complete in {elapsed}s")


if __name__ == "__main__":
    main()
