import { useEffect, useState } from "react";
import { getTopics, deleteTopic } from "../api";
import ConfirmModal from "./ConfirmModal";

export default function TopicList({ refreshKey, onTopicClick }) {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // topic name awaiting confirmation

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getTopics()
      .then((data) => {
        if (isMounted) setTopics(data.topics);
      })
      .catch(() => {
        if (isMounted) setTopics([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  function requestDelete(topic, e) {
    e.stopPropagation();
    setPendingDelete(topic);
  }

  async function confirmDelete() {
    const topic = pendingDelete;
    setDeletingTopic(topic);

    try {
      await deleteTopic(topic);
      setTopics((prev) => prev.filter((t) => t !== topic));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingTopic(null);
      setPendingDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading available topics...
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        No topics in the corpus yet — add one above to get started.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        You can currently ask about ({topics.length}):
      </div>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <span
            key={topic}
            style={{
              opacity: deletingTopic === topic ? 0 : 1,
              transform: deletingTopic === topic ? "scale(0.85)" : "scale(1)",
              maxWidth: deletingTopic === topic ? "0px" : "220px",
              marginRight: deletingTopic === topic ? "0px" : undefined,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: "opacity 0.3s ease, transform 0.3s ease, max-width 0.3s ease",
            }}
            className="group flex items-center gap-1 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 rounded-full pl-3 pr-1.5 py-1 hover:border-primary-400 hover:text-primary-700 dark:hover:border-primary-500 dark:hover:text-primary-300 transition-colors"
          >
            <button
              onClick={() => onTopicClick?.(topic)}
              className="hover:underline active:scale-95 transition-transform"
              title={`Search for "${topic}"`}
            >
              {topic}
            </button>
            <button
              onClick={(e) => requestDelete(topic, e)}
              title={`Remove ${topic}`}
              aria-label={`Remove ${topic}`}
              className="w-4 h-4 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 active:scale-90 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Remove this topic?"
        message={`This will permanently delete all embedded chunks for "${pendingDelete}" from the corpus.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        isLoading={deletingTopic === pendingDelete}
      />
    </div>
  );
}
