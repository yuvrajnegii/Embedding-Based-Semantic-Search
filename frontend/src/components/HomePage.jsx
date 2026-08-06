import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      {/* Subtle red stripe band across the top */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,87,87,0.7) 0%, rgba(224,64,63,1) 50%, rgba(161,19,26,0.7) 100%)",
        }}
      />

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-2xl"
        >
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full badge bg-[#101111] border border-[#242728] text-slate-400 mb-6">
            Embedding-based semantic search
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
            Search by meaning,
            <br />
            <span className="text-slate-400 dark:text-slate-400">not just keywords</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-8">
            Ask a question in plain language and find the answer hidden inside
            your documents — powered by vector embeddings and retrieval-augmented generation.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary text-base px-8 py-3"
          >
            Try it now
          </button>
        </motion.div>
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

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              number: 1,
              title: "Embed",
              description: "Every document is converted into a vector that captures its meaning.",
            },
            {
              number: 2,
              title: "Retrieve",
              description: "Your question is matched against the closest vectors in the corpus.",
            },
            {
              number: 3,
              title: "Answer",
              description: "An AI model reads the matches and writes a grounded answer, citing sources.",
            },
          ].map((step) => (
            <motion.div
              key={step.number}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="card card-hover group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#101111] border border-[#242728] flex items-center justify-center mb-4">
                <span className="text-lg font-semibold text-slate-400">{step.number}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </RevealSection>

    </div>
  );
}
