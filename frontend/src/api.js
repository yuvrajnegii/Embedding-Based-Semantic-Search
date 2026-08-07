const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function searchDocuments({ query, topK = 5, scoreThreshold = 0 }) {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      score_threshold: scoreThreshold / 100, // Convert percentage to fraction for backend
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Search failed with status ${response.status}`);
  }

  return response.json();
}

export async function askQuestion({ query, topK = 5, scoreThreshold = 0 }) {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      score_threshold: scoreThreshold / 100, // Convert percentage to fraction for backend
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Ask failed with status ${response.status}`);
  }

  return response.json();
}

export async function streamAsk({ query, topK = 5, scoreThreshold = 0 }, callbacks) {
  const { onMetadata, onToken, onDone, onError } = callbacks;

  const response = await fetch(`${API_BASE_URL}/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      score_threshold: scoreThreshold / 100, // Convert percentage to fraction for backend
    }),
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Stream failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop(); // keep incomplete trailing chunk for next read

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith("data:")) continue;

      const jsonStr = line.slice(5).trim();
      let payload;
      try {
        payload = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      if (payload.type === "metadata") onMetadata?.(payload);
      else if (payload.type === "token") onToken?.(payload.text);
      else if (payload.type === "error") onError?.(payload.message);
      else if (payload.type === "done") onDone?.();
    }
  }
}

export async function ingestText({ title, text }) {
  const response = await fetch(`${API_BASE_URL}/ingest/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Ingest failed with status ${response.status}`);
  }

  return response.json();
}

export async function ingestFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/ingest/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

export async function deleteTopic(topic) {
  const response = await fetch(`${API_BASE_URL}/topics/${encodeURIComponent(topic)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Delete failed with status ${response.status}`);
  }

  return response.json();
}

export async function getTopics() {
  const response = await fetch(`${API_BASE_URL}/topics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch topics: ${response.status}`);
  }
  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}