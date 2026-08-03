import { useEffect, useState } from "react";
import RevealSection from "./RevealSection";
import StatCounter from "./StatCounter";
import { checkHealth, getTopics } from "../api";

export default function HomePage({ onGetStarted }) {
  const [stats, setStats] = useState({ topics: 0, chunks: 0 });

  useEffect(() => {
    Promise.all([checkHealth(), getTopics()])
      .then(([health, topicsData]) => {
        setStats({
          topics: topicsData.count,
          chunks: health.total_chunks,
        });
      })
      .catch(() => {
        // Backend not reachable yet — keep stats at 0, page still renders.
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="text-center px-6 pt-20 pb-16">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 mb-4">
          Embedding-based semantic search
        </span>
        <h1 className="text-3xl font-semibold text-slate-900 mb-3 leading-tight">
          Search by meaning,
          <br />
          not just keywords
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Ask a question in plain language and find the answer hidden inside
          your documents — powered by vector embeddings and retrieval-augmented generation.
        </p>
        <button
          onClick={onGetStarted}
          className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-slate-800 transition-colors"
        >
          Try it now
        </button>
      </div>

      {/* Stats */}
      <RevealSection className="px-6 py-12 max-w-xl mx-auto">
        <div className="grid grid-cols-2 gap-6">
          <StatCounter target={stats.topics} label="topics indexed" />
          <StatCounter target={stats.chunks} label="embedded chunks" />
        </div>
      </RevealSection>

      {/* How it works */}
      <RevealSection className="px-6 py-12 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-5 text-center">
          How it works
        </h2>

        <div className="flex gap-3.5 p-4 rounded-xl border border-slate-200 mb-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-700 font-medium text-sm">
            1
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-0.5">Embed</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every document is converted into a vector that captures its meaning.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 p-4 rounded-xl border border-slate-200 mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-700 font-medium text-sm">
            2
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-0.5">Retrieve</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your question is matched against the closest vectors in the corpus.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 p-4 rounded-xl border border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-700 font-medium text-sm">
            3
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 mb-0.5">Answer</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              An AI model reads the matches and writes a grounded answer, citing sources.
            </p>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
