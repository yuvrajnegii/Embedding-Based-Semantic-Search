import time
import json
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend import config
from backend.models import SearchRequest, SearchResponse, HealthResponse, AskRequest, AskResponse, IngestTextRequest, IngestResponse, TopicsResponse, DeleteTopicResponse
from backend.search import search, get_collection_stats, list_topics, delete_topic
from backend.generate import generate_answer, generate_answer_stream
from backend.file_ingest import ingest_file_bytes
from backend.paste_ingest import ingest_paste
from backend.search import _get_model, _get_collection

app = FastAPI(
    title="Semantic Search API",
    description="Embedding-based semantic search over your document corpus",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def preload_resources():
    print("Preloading embedding model and ChromaDB collection...")
    _get_model()
    _get_collection()
    print("Ready.")


@app.get("/health", response_model=HealthResponse)
def health():
    try:
        stats = get_collection_stats()
        return HealthResponse(status="ok", **stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {e}")


@app.post("/search", response_model=SearchResponse)
def search_endpoint(request: SearchRequest):
    start = time.time()

    try:
        results = search(
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    took_ms = round((time.time() - start) * 1000, 1)

    return SearchResponse(
        query=request.query,
        count=len(results),
        results=results,
        took_ms=took_ms,
    )


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(request: AskRequest):
    start = time.time()

    try:
        chunks = search(
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")

    try:
        result = generate_answer(query=request.query, chunks=chunks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer generation failed: {e}")

    took_ms = round((time.time() - start) * 1000, 1)

    return AskResponse(
        query=request.query,
        answer=result["answer"],
        model=result["model"],
        sources_used=result["sources_used"],
        retrieved_chunks=chunks,
        took_ms=took_ms,
    )


@app.post("/ask/stream")
def ask_stream_endpoint(request: AskRequest):
    try:
        chunks = search(
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {e}")

    def event_generator():
        # First event: metadata (sources + retrieved chunks), so the UI can
        # render result cards immediately, before any answer text arrives.
        sources_used = list({c.get("filename") for c in chunks if c.get("filename")})
        metadata = {
            "type": "metadata",
            "sources_used": sources_used,
            "retrieved_chunks": chunks,
        }
        yield f"data: {json.dumps(metadata)}\n\n"

        try:
            for token in generate_answer_stream(request.query, chunks):
                payload = {"type": "token", "text": token}
                yield f"data: {json.dumps(payload)}\n\n"
        except Exception as e:
            error_payload = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_payload)}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/ingest/text", response_model=IngestResponse)
def ingest_text_endpoint(request: IngestTextRequest):
    try:
        result = ingest_paste(title=request.title, text=request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return IngestResponse(**result)


@app.post("/ingest/file", response_model=IngestResponse)
async def ingest_file_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = ingest_file_bytes(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File ingestion failed: {e}")

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return IngestResponse(**result)


@app.get("/topics", response_model=TopicsResponse)
def topics_endpoint():
    try:
        topics = list_topics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list topics: {e}")

    return TopicsResponse(topics=topics, count=len(topics))


@app.delete("/topics/{topic_name}", response_model=DeleteTopicResponse)
def delete_topic_endpoint(topic_name: str):
    try:
        result = delete_topic(topic_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")

    return DeleteTopicResponse(**result)


@app.get("/")
def root():
    return {
        "message": "Semantic Search API is running",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)