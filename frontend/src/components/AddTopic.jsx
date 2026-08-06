import { useRef, useState } from "react";
import { ingestTopic, ingestPdf } from "../api";

const MAX_PDF_MB = 20;

export default function AddTopic({ onTopicAdded }) {
  const [mode, setMode] = useState("wiki"); // "wiki" | "pdf"
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: "loading"|"success"|"error", message }
  const fileInputRef = useRef(null);

  function switchMode(next) {
    setMode(next);
    setStatus(null);
  }

  async function handleAddTopic(e) {
    e.preventDefault();
    if (!topic.trim()) return;

    setStatus({ type: "loading", message: `Fetching "${topic}"...` });

    try {
      const result = await ingestTopic(topic.trim());
      if (result.success) {
        setStatus({
          type: "success",
          message: `Added "${result.topic}" (${result.chunks_added} chunks). You can ask about it now.`,
        });
        setTopic("");
        onTopicAdded?.(result.topic);
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  function handleFileSelect(e) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && !selected.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Only .pdf files are supported." });
      setFile(null);
      return;
    }
    if (selected && selected.size > MAX_PDF_MB * 1024 * 1024) {
      setStatus({ type: "error", message: `PDF exceeds the ${MAX_PDF_MB}MB limit.` });
      setFile(null);
      return;
    }
    setStatus(null);
    setFile(selected);
  }

  async function handleUploadPdf(e) {
    e.preventDefault();
    if (!file) return;

    setStatus({ type: "loading", message: `Uploading "${file.name}"...` });

    try {
      const result = await ingestPdf(file);
      if (result.success) {
        setStatus({
          type: "success",
          message: `Added "${result.topic}" (${result.chunks_added} chunks). You can ask about it now.`,
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onTopicAdded?.(result.topic);
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Add new topic
        </p>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-700 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => switchMode("wiki")}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
              mode === "wiki"
                ? "bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Wikipedia
          </button>
          <button
            type="button"
            onClick={() => switchMode("pdf")}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
              mode === "pdf"
                ? "bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Upload PDF
          </button>
        </div>
      </div>

      {mode === "wiki" ? (
        <form onSubmit={handleAddTopic} className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Renaissance art"
            className="input-base flex-1"
            aria-label="Topic name"
          />
          <button
            type="submit"
            disabled={status?.type === "loading" || !topic.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status?.type === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </span>
            ) : (
              "Add"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUploadPdf} className="flex gap-2 flex-col sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-gray-700 dark:file:text-slate-300 dark:hover:file:bg-gray-600 transition-colors"
          />
          <button
            type="submit"
            disabled={status?.type === "loading" || !file}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status?.type === "loading" ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {status && status.type !== "loading" && (
        <div
          className={`text-xs mt-3 p-2.5 rounded-md animate-slide-down ${
            status.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.message}
        </div>
      )}
      {mode === "pdf" && !status && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Text-based PDFs only (scanned/image PDFs aren't OCR'd yet) · max {MAX_PDF_MB}MB
        </div>
      )}
    </div>
  );
}
