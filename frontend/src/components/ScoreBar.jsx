import { useState, useEffect } from "react";

function getScoreColor(score) {
  if (score >= 0.85) return "#4F46E5"; // high confidence - indigo
  if (score >= 0.70) return "#6366F1"; // medium confidence - lighter indigo
  return "#94A3B8"; // low confidence - slate
}

export default function ScoreBar({ score }) {
  const percent = Math.round(score * 100);
  const color = getScoreColor(score);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-sm font-medium min-w-[2.25rem] text-right"
        style={{ color }}
      >
        {score.toFixed(2)}
      </span>
    </div>
  );
}
