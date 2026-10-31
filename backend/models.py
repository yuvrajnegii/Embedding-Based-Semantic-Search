from pydantic import BaseModel, Field
from typing import List, Optional


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    top_k: int = Field(5, ge=1, le=50, description="Number of results to return")
    score_threshold: float = Field(0.0, ge=0.0, le=1.0, description="Minimum similarity score")


class ResultItem(BaseModel):
    chunk_id: str
    text: str
    score: float
    filename: Optional[str] = None
    doc_id: Optional[str] = None
    source: Optional[str] = None
    chunk_index: Optional[int] = None


class SearchResponse(BaseModel):
    query: str
    count: int
    results: List[ResultItem]
    took_ms: float


class AskRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language question")
    top_k: int = Field(5, ge=1, le=20, description="Number of chunks to retrieve as context")
    score_threshold: float = Field(0.0, ge=0.0, le=1.0, description="Minimum similarity score for retrieved chunks")


class AskResponse(BaseModel):
    query: str
    answer: str
    model: str
    sources_used: List[str]
    retrieved_chunks: List[ResultItem]
    took_ms: float


class IngestTextRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Human-readable title/label for the pasted text")
    text: str = Field(..., min_length=1, description="Plain text content to ingest")


class IngestResponse(BaseModel):
    success: bool
    topic: Optional[str] = None
    chunks_added: Optional[int] = None
    error: Optional[str] = None


class TopicsResponse(BaseModel):
    topics: List[str]
    count: int


class DeleteTopicResponse(BaseModel):
    success: bool
    topic: Optional[str] = None
    chunks_removed: Optional[int] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    collection_name: str
    total_chunks: int
    embedding_model: str