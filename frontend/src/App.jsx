import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./components/SearchBar";
import ResultCard from "./components/ResultCard";
import AnswerCard from "./components/AnswerCard";
import LoadingSkeleton from "./components/LoadingSkeleton";
import HomePage from "./components/HomePage";
import AddTopic from "./components/AddTopic";
import TopicList from "./components/TopicList";
import ThemeToggle from "./components/ThemeToggle";
import { useToast } from "./context/ToastContext";
import { searchDocuments, streamAsk } from "./api";

export default function App() {
  const { toast } = useToast();
  const [view, setView] = useState("home");
  const [mode, setMode] = useState("search");
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReRanking, setIsReRanking] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [topicsRefreshKey, setTopicsRefreshKey] = useState(0);
  const [prefillQuery, setPrefillQuery] = useState("");
  const [threshold, setThreshold] = useState(0.0);
  const [lastQuery, setLastQuery] = useState("");
  const reRankTimer = useRef(null);

  function handleReset() {
    setResults([]);
    setAnswer(null);
    setError(null);
    setMeta(null);
    setLastQuery("");
  }

  // Live re-run of the last search with a new threshold (search mode only).
  async function reRank(query, scoreThreshold) {
    if (!query.trim() || mode !== "search") return;
    setIsReRanking(true);
    setError(null);
    try {
      const data = await searchDocuments({ query, topK: 10, scoreThreshold });
      setResults(data.results);
      setMeta({ count: data.count, tookMs: data.took_ms, query: data.query });
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setIsReRanking(false);
    }
  }

  // Debounced threshold change → live re-rank as the user drags.
  function handleThresholdChange(newThreshold) {
    setThreshold(newThreshold);
    if (!lastQuery.trim() || mode !== "search") return;
    clearTimeout(reRankTimer.current);
    reRankTimer.current = setTimeout(() => {
      reRank(lastQuery, newThreshold);
    }, 250);
  }

  useEffect(() => {
    return () => clearTimeout(reRankTimer.current);
  }, []);

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
              toast(message, "error");
            },
          },
        );
        setLastQuery(query);
      } else {
        const data = await searchDocuments({ query, topK: 10, scoreThreshold });
        setResults(data.results);
        setMeta({ count: data.count, tookMs: data.took_ms, query: data.query });
        setLastQuery(query);
      }
    } catch (err) {
      setError(err.message);
      setResults([]);
      setAnswer(null);
      setMeta(null);
      toast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {view === "home" ? (
        <HomePage onGetStarted={() => setView("app")} />
      ) : (
        <div className="animate-fade-in">
          <header className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Semantic Search
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("home")}
                className="btn-ghost text-sm"
                aria-label="Back to home"
              >
                ← Home
              </button>
              <ThemeToggle />
            </div>
          </header>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Search your documents by meaning, not just keywords.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
            <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-md p-1 border border-slate-200 dark:border-gray-700">
              <button
                onClick={() => setMode("search")}
                className={`text-sm px-3 py-1.5 rounded-md transition-all duration-150 ${
                  mode === "search"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-gray-700"
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setMode("ask")}
                className={`text-sm px-3 py-1.5 rounded-md transition-all duration-150 ${
                  mode === "ask"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-gray-700"
                }`}
              >
                Ask AI
              </button>
            </div>

            <button
              onClick={handleReset}
              title="Clear results"
              className="btn-ghost text-sm whitespace-nowrap"
            >
              ↻ Clear
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
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
          />

          {meta && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                {mode === "ask"
                  ? `${meta.count} source chunk${meta.count !== 1 ? "s" : ""}`
                  : `${meta.count} result${meta.count !== 1 ? "s" : ""}`}
              </span>
              <span>· {meta.tookMs}ms</span>
              {mode === "search" && (
                <>
                  <span>· threshold {threshold.toFixed(2)}</span>
                  {isReRanking && (
                    <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      re-ranking…
                    </span>
                  )}
                </>
              )}
              <span>Query: "{meta.query}"</span>
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
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-12 animate-fade-in">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mode === "search" ? (
                <>
                  <p>No results above a score of {threshold.toFixed(2)}.</p>
                  <p className="text-xs mt-1">
                    Slide the threshold lower to surface more results.
                  </p>
                </>
              ) : (
                <>
                  <p>No results above the current score threshold.</p>
                  <p className="text-xs mt-1">
                    Try lowering the threshold or using different keywords.
                  </p>
                </>
              )}
            </div>
          )}

          {isLoading && mode === "search" && <LoadingSkeleton count={3} />}

          <div className="space-y-2">
            {!(isLoading && mode === "search") &&
              results.map((result, i) => (
                <ResultCard
                  key={result.chunk_id}
                  result={result}
                  isTopResult={i === 0}
                  index={i}
                  query={meta?.query || lastQuery}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
