import { useState } from "react";
import { ingestText } from "../api";
import { useToast } from "../context/ToastContext";
import UploadFile from "./UploadFile";

const EXAMPLE = {
  title: "The Water Cycle",
  text: `Water moves continuously through Earth's atmosphere, oceans, and land in a cycle driven by the sun's energy. The main processes are evaporation, condensation, and precipitation. Heat from the sun causes water from oceans, lakes, and rivers to evaporate into water vapor. As the vapor rises and cools, it condenses into clouds. When the droplets grow heavy enough, they fall back to the surface as rain or snow. Some precipitation soaks into the ground as groundwater, while the rest flows over land into rivers and back to the ocean, where the cycle begins again.`,
};

export default function AddTopic({ onTopicAdded }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("text"); // "text" | "pdf"
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null); // { type: "loading"|"success"|"error", message }

  function switchMode(next) {
    setMode(next);
    setStatus(null);
  }

  // Errors go to a toast; success stays inline so the ingestion result is visible.
  function reportError(message) {
    setStatus(null);
    toast(message, "error");
  }

  function loadExample() {
    setTitle(EXAMPLE.title);
    setText(EXAMPLE.text);
    setStatus(null);
  }

  async function handleAddText(e) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    setStatus({ type: "loading", message: `Adding "${title.trim()}"...` });

    try {
      const result = await ingestText({ title: title.trim(), text: text.trim() });
      if (result.success) {
        setStatus({
          type: "success",
          message: `Added "${result.topic}" (${result.chunks_added} chunks). You can ask about it now.`,
        });
        setTitle("");
        setText("");
        onTopicAdded?.(result.topic);
      } else {
        reportError(result.error);
      }
    } catch (err) {
      reportError(err.message);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Add new content
        </p>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-700 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => switchMode("text")}
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
              mode === "text"
                ? "bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Paste text
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
            Upload file
          </button>
        </div>
      </div>

      {mode === "text" ? (
        <form onSubmit={handleAddText} className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title, e.g. Meeting notes"
            className="input-base w-full"
            aria-label="Title"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            rows={5}
            className="input-base w-full resize-y"
            aria-label="Pasted text"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadExample}
              className="btn-ghost text-sm"
            >
              Try an example
            </button>
            <button
              type="submit"
              disabled={status?.type === "loading" || !title.trim() || !text.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            >
              {status?.type === "loading" ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      ) : (
        <UploadFile onTopicAdded={onTopicAdded} />
      )}

      {status?.type === "success" && (
        <div
          className="text-xs mt-3 p-2.5 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 animate-slide-down"
          role="status"
        >
          {status.message}
        </div>
      )}
      {mode === "pdf" && !status && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Supports .pdf, .txt, and .docx (scanned/image PDFs aren't OCR'd yet) · max 20MB
        </div>
      )}
    </div>
  );
}
