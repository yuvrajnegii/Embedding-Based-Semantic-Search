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
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => switchMode("wiki")}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
            mode === "wiki"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          Wikipedia
        </button>
        <button
          type="button"
          onClick={() => switchMode("pdf")}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
            mode === "pdf"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          Upload PDF
        </button>
      </div>

      {mode === "wiki" ? (
        <form onSubmit={handleAddTopic} className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Renaissance art"
            className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            disabled={status?.type === "loading" || !topic.trim()}
            className="bg-slate-900 text-white text-sm font-medium px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-slate-800 active:scale-95 transition-transform"
          >
            {status?.type === "loading" ? "Adding..." : "Add"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUploadPdf} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelect}
            className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
          />
          <button
            type="submit"
            disabled={status?.type === "loading" || !file}
            className="bg-slate-900 text-white text-sm font-medium px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-slate-800 active:scale-95 transition-transform"
          >
            {status?.type === "loading" ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {status && status.type !== "loading" && (
        <div
          className={`text-xs mt-2 ${
            status.type === "success" ? "text-indigo-600" : "text-red-600"
          }`}
        >
          {status.message}
        </div>
      )}
      {mode === "pdf" && !status && (
        <div className="text-[11px] text-slate-400 mt-2">
          Text-based PDFs only (scanned/image PDFs aren't OCR'd yet) · max {MAX_PDF_MB}MB
        </div>
      )}
    </div>
  );
}
