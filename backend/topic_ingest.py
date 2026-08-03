import wikipedia
from typing import Dict

from ingestion.chunker import chunk_documents
from ingestion.embedder import embed_and_store


def ingest_topic(topic: str) -> Dict:
    """
    Fetch a single Wikipedia topic live, chunk it, embed it, and store it
    in ChromaDB — so it's immediately searchable/askable afterward.
    """
    wikipedia.set_lang("en")

    try:
        page = wikipedia.page(topic, auto_suggest=False)
    except wikipedia.exceptions.DisambiguationError as e:
        return {
            "success": False,
            "error": f"'{topic}' is ambiguous. Try one of: {', '.join(e.options[:5])}",
        }
    except wikipedia.exceptions.PageError:
        return {
            "success": False,
            "error": f"No Wikipedia page found for '{topic}'.",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

    doc_id = topic.lower().replace(" ", "_")
    document = {
        "doc_id": doc_id,
        "filename": f"{doc_id}.txt",
        "text": page.content,
        "source": f"wikipedia:{page.title}",
    }

    chunks = chunk_documents([document], chunk_size=400, chunk_overlap=80)
    embed_and_store(chunks)

    return {
        "success": True,
        "topic": page.title,
        "chunks_added": len(chunks),
    }