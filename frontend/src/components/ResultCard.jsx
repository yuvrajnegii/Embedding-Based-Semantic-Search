import { useState, useEffect } from "react";
import ScoreBar from "./ScoreBar";

export default function ResultCard({ result, isTopResult, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 90);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.35s ease, transform 0.35s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      className={`bg-white border border-slate-200 rounded-lg p-4 mb-2.5 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 ${
        isTopResult ? "border-l-[3px] border-l-indigo-600 rounded-l-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="text-sm font-medium text-slate-900 leading-snug">
          {result.filename || result.doc_id}
        </div>
      </div>

      <div className="mb-2">
        <ScoreBar score={result.score} />
      </div>

      <p className={`text-sm text-slate-600 leading-relaxed mb-1.5 ${expanded ? "" : "line-clamp-3"}`}>
        {result.text}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-indigo-600 font-medium mb-2.5 hover:underline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        {result.chunk_index !== undefined && (
          <span>Chunk {result.chunk_index}</span>
        )}
        {result.source && (
          <>
            <span>·</span>
            <span className="truncate">{result.source}</span>
          </>
        )}
      </div>
    </div>
  );
}
