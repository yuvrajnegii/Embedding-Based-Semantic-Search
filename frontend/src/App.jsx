import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ResultCard from "./components/ResultCard";
import AnswerCard from "./components/AnswerCard";
import LoadingSkeleton from "./components/LoadingSkeleton";
import HomePage from "./components/HomePage";
import AddTopic from "./components/AddTopic";
import TopicList from "./components/TopicList";
import { searchDocuments, streamAsk } from "./api";

export default function App() {
  const [view, setView] = useState("home"); // "home" | "app"
  const [mode, setMode] = useState("search"); // "search" | "ask"
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [topicsRefreshKey, setTopicsRefreshKey] = useState(0);
  const [prefillQuery, setPrefillQuery] = useState("");

  function handleReset() {
    setResults([]);
    setAnswer(null);
    setError(null);
    setMeta(null);
  }

  async function handleSearch({ query, scoreThreshold }) {
    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      if (mode === "ask") {
        setAnswer({ text: "", model: "llama-3.1-8b-instant", sourcesUsed: [] });
        const startTime = performance.now();

        await streamAsk(
          { query, topK: 5, scoreThreshold },
          {
            onMetadata: (meta) => {
              setResults(meta.retrieved_chunks);
              setAnswer((prev) => ({
                ...prev,
                sourcesUsed: meta.sources_used,
              }));
              setMeta({
                count: meta.retrieved_chunks.length,
                tookMs: 0,
                query,
              });
            },
            onToken: (text) => {
              setAnswer((prev) => ({ ...prev, text: prev.text + text }));
            },
            onDone: () => {
              const tookMs = Math.round(performance.now() - startTime);
              setMeta((prev) => (prev ? { ...prev, tookMs } : prev));
            },
            onError: (message) => {
              setError(message);
            },
          },
        );
      } else {
        const data = await searchDocuments({ query, topK: 10, scoreThreshold });
        setResults(data.results);
        setMeta({ count: data.count, tookMs: data.took_ms, query: data.query });
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
      setAnswer(null);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {view === "home" ? (
        <HomePage onGetStarted={() => setView("app")} />
      ) : (
        <div className="px-4 py-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-slate-900">
              Semantic Search
            </h1>
            <button
              onClick={() => setView("home")}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              ← Back to home
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Search your documents by meaning, not just keywords.
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-slate-100 rounded-md p-1 w-fit">
              <button
                onClick={() => setMode("search")}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  mode === "search"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500"
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setMode("ask")}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  mode === "ask"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500"
                }`}
              >
                Ask AI
              </button>
            </div>

            <button
              onClick={handleReset}
              title="Clear results"
              className="text-sm text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          <AddTopic onTopicAdded={() => setTopicsRefreshKey((k) => k + 1)} />

          <TopicList
            refreshKey={topicsRefreshKey}
            onTopicClick={(topic) => setPrefillQuery(topic)}
          />

          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            prefillQuery={prefillQuery}
          />

          {meta && (
            <div className="text-xs text-slate-400 mb-3">
              {mode === "ask"
                ? `${meta.count} source chunks`
                : `${meta.count} result${meta.count !== 1 ? "s" : ""}`}{" "}
              · {meta.tookMs}ms
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {answer && (
            <AnswerCard
              answer={answer.text}
              model={answer.model}
              sourcesUsed={answer.sourcesUsed}
              isStreaming={isLoading && mode === "ask"}
            />
          )}

          {!isLoading && !error && results.length === 0 && meta && (
            <div className="text-center text-sm text-slate-400 py-8">
              No results above the current score threshold.
            </div>
          )}

          {isLoading && mode === "search" && <LoadingSkeleton count={3} />}

          <div>
            {!(isLoading && mode === "search") &&
              results.map((result, i) => (
                <ResultCard
                  key={result.chunk_id}
                  result={result}
                  isTopResult={i === 0}
                  index={i}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
