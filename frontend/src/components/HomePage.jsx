import { useEffect, useState } from "react";
import RevealSection from "./RevealSection";
import StatCounter from "./StatCounter";
import { checkHealth, getTopics } from "../api";

export default function HomePage({ onGetStarted }) {
  const [stats, setStats] = useState(null); // null while loading
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      // Fetch each stat independently so a failure on one endpoint
      // doesn't zero out the others (Promise.all would reject all).
      const [healthRes, topicsRes] = await Promise.allSettled([
        checkHealth(),
        getTopics(),
      ]);
      if (!isMounted) return;

      const health = healthRes.status === "fulfilled" ? healthRes.value : null;
      const topics = topicsRes.status === "fulfilled" ? topicsRes.value : null;

      if (health || topics) {
        setStats({
          topics: topics?.count ?? 0,
          chunks: health?.total_chunks ?? 0,
        });
      } else {
        setStatsError("Couldn't load stats — is the backend running?");
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl animate-fade-in">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 mb-6">
            Embedding-based semantic search
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 dark:text-white mb-4 leading-tight">
            Search by meaning,
            <br />
            <span className="text-primary-600 dark:text-primary-400">not just keywords</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
            Ask a question in plain language and find the answer hidden inside
            your documents — powered by vector embeddings and retrieval-augmented generation.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary text-base px-8 py-3 hover:shadow-lg hover:shadow-primary-500/25"
          >
            Try it now
          </button>
        </div>
      </div>

      {/* Stats */}
      <RevealSection className="px-6 py-16 max-w-4xl mx-auto">
        {statsError && !stats && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
            {statsError}
          </p>
        )}
        {!stats ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3" aria-label="Loading stats">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-100 dark:bg-gray-800 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <StatCounter target={stats.topics} label="topics indexed" />
            <StatCounter target={stats.chunks} label="embedded chunks" />
            <StatCounter
              target={Math.round(stats.chunks / Math.max(stats.topics, 1))}
              label="avg chunks/topic"
            />
          </div>
        )}
      </RevealSection>

      {/* How it works */}
      <RevealSection className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-10 text-center">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              number: 1,
              color: "blue",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              textColor: "text-blue-700 dark:text-blue-300",
              title: "Embed",
              description: "Every document is converted into a vector that captures its meaning.",
            },
            {
              number: 2,
              color: "indigo",
              bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
              textColor: "text-indigo-700 dark:text-indigo-300",
              title: "Retrieve",
              description: "Your question is matched against the closest vectors in the corpus.",
            },
            {
              number: 3,
              color: "purple",
              bgColor: "bg-purple-50 dark:bg-purple-900/20",
              textColor: "text-purple-700 dark:text-purple-300",
              title: "Answer",
              description: "An AI model reads the matches and writes a grounded answer, citing sources.",
            },
          ].map((step) => (
            <div
              key={step.number}
              className={`group ${step.bgColor} border border-slate-200 dark:border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:border-transparent hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <span className={`text-2xl font-bold ${step.textColor}`}>{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </RevealSection>

    </div>
  );
}
