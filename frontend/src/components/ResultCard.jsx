import { useState, useEffect } from "react";
import ScoreBar from "./ScoreBar";

export default function ResultCard({ result, isTopResult, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.text).then(() => {
      // Could add a toast notification here
    });
  };

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      className={`
        card card-hover
        ${isTopResult ? "border-l-4 border-l-primary-500" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isTopResult && (
              <span className="badge badge-primary text-[10px] px-1.5 py-0.5 shrink-0">
                Top Match
              </span>
            )}
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug truncate">
              {result.filename || result.doc_id}
            </p>
          </div>
          {result.source && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {result.source}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 dark:hover:text-slate-300 transition-colors focus-visible-ring"
            aria-label="Copy text to clipboard"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 dark:hover:text-slate-300 transition-colors focus-visible-ring"
            aria-label={expanded ? "Show less" : "Show more"}
            aria-expanded={expanded}
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-2">
        <ScoreBar score={result.score} />
      </div>

      <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-1.5 ${expanded ? "" : "line-clamp-3"}`}>
        {result.text}
      </p>

      {expanded && result.chunk_index !== undefined && (
        <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="badge badge-secondary bg-slate-100 dark:bg-gray-700">
              Chunk {result.chunk_index}
            </span>
            {result.doc_id && (
              <span className="badge badge-secondary bg-slate-100 dark:bg-gray-700">
                ID: {result.doc_id.slice(0, 12)}...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
