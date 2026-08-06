import { useState, useEffect, useRef, useCallback } from "react";

export default function SearchBar({ onSearch, isLoading, prefillQuery, threshold, onThresholdChange }) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (prefillQuery) setQuery(prefillQuery);
  }, [prefillQuery]);

  // Auto-grow the textarea's height to fit its content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [query]);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (e.key === "Escape") {
        textareaRef.current?.blur();
        if (query) setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query, scoreThreshold: threshold });
  }, [query, threshold, onSearch]);

  const handleKeyDown = useCallback((e) => {
    // Enter submits, Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="mb-4 animate-slide-up">
      <div className="flex gap-2 mb-3 items-end">
        <label htmlFor="search-input" className="sr-only">
          Search query
        </label>
        <textarea
          ref={textareaRef}
          id="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search your documents... (press / to focus)"
          rows={1}
          className={`
            flex-1 bg-white border rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400
            resize-none overflow-hidden leading-relaxed max-h-40 overflow-y-auto transition-all duration-150
            focus-visible-ring
            ${isFocused
              ? "border-white"
              : "border-[#242728] hover:border-[#3a3d3e]"
            }
            ${isLoading ? "bg-slate-50 dark:bg-gray-800/50" : ""}
            dark:bg-gray-800 dark:text-white dark:placeholder-gray-500
          `}
          aria-describedby="threshold-help"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`
            btn-primary px-4 py-3 min-w-[100px] whitespace-nowrap
            ${isLoading || !query.trim() ? "opacity-50 cursor-not-allowed" : ""}
            active:scale-95
          `}
          aria-label={isLoading ? "Searching..." : "Search"}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3" id="threshold-help">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Score threshold</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={threshold * 100}
            onChange={(e) => onThresholdChange?.(Number(e.target.value) / 100)}
            className={`
              flex-1 accent-white h-1.5 rounded appearance-none
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-[#0d0d0d]
              [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#3a3d3e]
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-[#0d0d0d]
              [&::-moz-range-thumb]:shadow-[0_0_0_1px_#3a3d3e]
            `}
            aria-label="Score threshold"
          />
          <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 min-w-[2.5rem] text-right">
            {threshold.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">
          Lower = more results, Higher = more precise
        </p>
      </div>

      <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1">
        Drag the slider to re-rank results live. Press{" "}
        <kbd className="keycap font-sans">/</kbd> to focus search,{" "}
        <kbd className="keycap font-sans">Esc</kbd> to clear
      </p>
    </form>
  );
}
