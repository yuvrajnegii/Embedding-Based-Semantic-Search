import { useState, useEffect, useRef } from "react";

export default function SearchBar({ onSearch, isLoading, prefillQuery }) {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(0.0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (prefillQuery) setQuery(prefillQuery);
  }, [prefillQuery]);

  // Auto-grow the textarea's height to fit its content, so the full
  // query is always visible instead of scrolling off to one side.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [query]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query, scoreThreshold: threshold });
  }

  function handleKeyDown(e) {
    // Enter submits, Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex gap-2 mb-3 items-end">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search your documents..."
          rows={1}
          className="flex-1 bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none overflow-hidden leading-relaxed max-h-40 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 active:scale-95 transition-transform"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Score threshold</span>
        <input
          type="range"
          min={0}
          max={100}
          value={threshold * 100}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
          className="w-32 accent-indigo-600"
        />
        <span className="text-xs font-medium text-slate-700 min-w-[2.5rem]">
          {threshold.toFixed(2)}
        </span>
      </div>
    </form>
  );
}
