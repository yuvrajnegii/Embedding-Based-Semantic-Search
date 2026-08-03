import { useRef, useState } from "react";
import { ingestPdf } from "../api";

const MAX_MB = 20;

export default function UploadPdf({ onTopicAdded }) {
  const [status, setStatus] = useState(null); // { type: "loading"|"success"|"error", message }
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Please choose a .pdf file." });
      return;
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setStatus({ type: "error", message: `File is larger than the ${MAX_MB}MB limit.` });
      return;
    }

    setFileName(file.name);
    setStatus({ type: "loading", message: `Uploading "${file.name}"...` });

    try {
      const result = await ingestPdf(file);
      if (result.success) {
        setStatus({
          type: "success",
          message: `Added "${result.topic}" (${result.chunks_added} chunks). You can ask about it now.`,
        });
        onTopicAdded?.(result.topic);
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
      <div className="text-xs font-medium text-slate-600 mb-2">
        Or upload a PDF
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-between gap-2 bg-white border border-dashed border-slate-300 rounded-md px-3 py-2.5 cursor-pointer hover:border-indigo-400 transition-colors"
      >
        <span className="text-sm text-slate-500 truncate">
          {fileName || "Click or drag a PDF here"}
        </span>
        <span className="text-xs font-medium text-slate-900 flex-shrink-0">
          {status?.type === "loading" ? "Uploading..." : "Browse"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {status && status.type !== "loading" && (
        <div
          className={`text-xs mt-2 ${
            status.type === "success" ? "text-indigo-600" : "text-red-600"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
