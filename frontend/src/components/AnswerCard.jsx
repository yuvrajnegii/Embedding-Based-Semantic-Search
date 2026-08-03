export default function AnswerCard({ answer, model, sourcesUsed, isStreaming }) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          AI Answer
        </span>
        <span className="text-xs text-indigo-500">· {model}</span>
      </div>
      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-3">
        {answer}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-indigo-600 ml-0.5 align-middle animate-pulse" />
        )}
      </p>
      {sourcesUsed?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500">Sources:</span>
          {sourcesUsed.map((src) => (
            <span
              key={src}
              className="text-xs bg-white border border-indigo-200 text-indigo-700 rounded px-2 py-0.5"
            >
              {src}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
