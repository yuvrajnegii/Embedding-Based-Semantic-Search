import { useState, useEffect } from "react";

// Colors resolve via CSS variables so dark mode swaps to muted values.
function getScoreColor(score) {
  // score is now 0-100 percentage
  if (score >= 85) return "rgb(var(--score-high))"; // high confidence
  if (score >= 70) return "rgb(var(--score-mid))";  // medium confidence
  return "rgb(var(--score-low))";                     // low confidence
}

export default function ScoreBar({ score }) {
  // score is now 0-100 percentage
  const percent = Math.round(score);
  const color = getScoreColor(score);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-sm font-medium min-w-[2.25rem] text-right"
        style={{ color }}
      >
        {score.toFixed(0)}%
      </span>
    </div>
  );
}
