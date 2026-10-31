import { useRef, useState } from "react";
import { ingestFile } from "../api";

const MAX_MB = 20;
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx"];

function isAllowed(name) {
  const ext = name.toLowerCase().split(".").pop();
  return ALLOWED_EXTENSIONS.includes(`.${ext}`);
}

export default function UploadFile({ onTopicAdded }) {
  const [status, setStatus] = useState(null); // { type: "loading"|"success"|"error", message }
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;

    if (!isAllowed(file.name)) {
      setStatus({ type: "error", message: "Please choose a .pdf, .txt, or .docx file." });
      return;
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setStatus({ type: "error", message: `File is larger than the ${MAX_MB}MB limit.` });
      return;
    }

    setFileName(file.name);
    setStatus({ type: "loading", message: `Uploading "${file.name}"...` });

    try {
      const result = await ingestFile(file);
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
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-3 mb-4 transition-colors duration-200">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
        Or upload a file
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-dashed border-slate-300 dark:border-gray-600 rounded-md px-3 py-2.5 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {fileName || "Click or drag a file here"}
        </span>
        <span className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">
          {status?.type === "loading" ? "Uploading..." : "Browse"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {status && status.type !== "loading" && (
        <div
          className={`text-xs mt-2 p-2 rounded-md ${
            status.type === "success"
              ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
              : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
          }`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
