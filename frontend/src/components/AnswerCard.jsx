import ReactMarkdown from "react-markdown";
import { useToast } from "../context/ToastContext";

// Styling for each markdown element so the AI answer reads cleanly in
// both light and dark mode.
const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-semibold mb-2 mt-4 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-3 first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary-300 dark:border-primary-700 pl-3 my-3 text-slate-600 dark:text-slate-300 italic">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-3 my-2 overflow-x-auto text-[13px] leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    // Fenced code blocks carry a "language-*" className; inline code doesn't.
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className={`${className} font-mono`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-slate-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[0.9em] font-mono text-slate-800 dark:text-slate-200"
        {...props}
      >
        {children}
      </code>
    );
  },
  hr: () => <hr className="border-slate-200 dark:border-gray-700 my-3" />,
};

export default function AnswerCard({ answer, sourcesUsed, isStreaming }) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard
      .writeText(answer)
      .then(() => toast("Answer copied to clipboard", "success"))
      .catch(() => toast("Couldn't copy to clipboard", "error"));
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
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-gray-700 dark:hover:text-slate-300 transition-colors focus-visible-ring"
          aria-label="Copy answer"
          title="Copy to clipboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
      </div>

      <div className="text-sm text-violet-300 dark:text-violet-200">
        <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary-600 ml-0.5 align-middle animate-pulse" aria-hidden="true" />
        )}
      </div>

      {sourcesUsed?.length > 0 && (
        <div className="pt-3 mt-3 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 dark:text-slate-300">Sources:</span>
            {sourcesUsed.map((src) => (
              <span key={src} className="badge badge-primary text-xs px-2 py-0.5">
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
