import { useState } from "react";

export default function AnswerCard({ answer, model, sourcesUsed, isStreaming }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 animate-slide-down">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">AI Answer</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{model}</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-gray-700 dark:hover:text-slate-300 transition-colors focus-visible-ring"
          aria-label={copied ? "Copied!" : "Copy answer"}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap mb-3">
        {answer}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary-600 ml-0.5 align-middle animate-pulse" aria-hidden="true" />
        )}
      </p>

      {sourcesUsed?.length > 0 && (
        <div className="pt-3 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sources:</span>
            {sourcesUsed.map((src) => (
              <span
                key={src}
                className="badge badge-primary text-xs px-2 py-0.5"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
