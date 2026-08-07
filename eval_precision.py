"""
Self-labeled topic-purity evaluation for the Embedding-Based Semantic Search project.

Each query is labeled with the topic document(s) considered RELEVANT. A retrieved
chunk counts as a hit if its filename maps to a relevant topic.

Metrics computed over top-5 retrieval (via the project's real search pipeline):
  - Precision@5 : fraction of top-5 chunks from a relevant topic
  - Accuracy@1  : whether the top-1 chunk is from a relevant topic
  - MRR         : mean reciprocal rank of the first relevant chunk

Queries were authored against the actual corpus content (data/raw/*.txt) and split
by difficulty: easy (direct keyword), medium (paraphrased), hard (cross-topic).
"""
import os
from collections import defaultdict

from backend.search import search  # real pipeline: embed query -> chroma top-k

# filename -> topic map. Stored filenames are slugified stems + extension.
def topic_of(filename: str) -> str:
    f = (filename or "").lower()
    if "quantum" in f:
        return "quantum"
    if "climate" in f:
        return "climate"
    if "intelligence" in f or "ai" in f or "artificial" in f:
        return "ai"
    return "unknown"


# Each entry: (query, [relevant topics])
# 20 per topic: ~6 easy / 10 medium / 4 hard (cross-topic).
LABELED = [
    # ===== AI =====
    ("What is artificial intelligence?", ["ai"]),
    ("What is an AI winter?", ["ai"]),
    ("What is the transformer architecture?", ["ai"]),
    ("What is a Markov decision process?", ["ai"]),
    ("What is artificial general intelligence (AGI)?", ["ai"]),
    ("What is an ontology in knowledge representation?", ["ai"]),
    ("How do reasoning models improve performance on math and coding problems?", ["ai"]),
    ("How do agents choose actions using expected utility?", ["ai"]),
    ("What can a knowledge base represent?", ["ai"]),
    ("Why do early reasoning algorithms suffer from combinatorial explosion?", ["ai"]),
    ("What is inverse reinforcement learning used for?", ["ai"]),
    ("How does game theory apply to AI decision-making?", ["ai"]),
    ("What is information value theory?", ["ai"]),
    ("Why was 2012 significant for deep learning?", ["ai"]),
    ("What academic fields does AI research draw upon?", ["ai"]),
    ("What is a rational agent?", ["ai"]),
    ("Which computational methods can speed up solving hard problems?", ["quantum", "ai"]),
    ("How can machines perceive their environment and take actions?", ["ai"]),
    ("How do systems handle probabilistic outcomes under uncertainty?", ["ai", "quantum"]),
    ("Which techniques enable fast simulation of complex systems?", ["ai", "quantum", "climate"]),
    # ===== Climate =====
    ("What is global warming?", ["climate"]),
    ("What are greenhouse gases?", ["climate"]),
    ("What is the Paris Agreement?", ["climate"]),
    ("What is ocean acidification?", ["climate"]),
    ("What causes global dimming?", ["climate"]),
    ("What are climate proxies?", ["climate"]),
    ("How much has carbon dioxide increased since pre-industrial times?", ["climate"]),
    ("How do sulfate aerosols affect temperature?", ["climate"]),
    ("Why was 2024 the warmest year on record?", ["climate"]),
    ("How does adaptation reduce the risks of climate change?", ["climate"]),
    ("What are tipping points in the climate system?", ["climate"]),
    ("Why are poorer communities most vulnerable to climate change?", ["climate"]),
    ("How can fossil fuels be phased out?", ["climate"]),
    ("What is the difference between global warming and climate change?", ["climate"]),
    ("How did the Last Interglacial compare to today's temperatures?", ["climate"]),
    ("What ocean effects are caused by climate change?", ["climate"]),
    ("How can large-scale computation model the Earth's climate system?", ["climate", "quantum", "ai"]),
    ("How do we use data and models to predict future conditions on Earth?", ["climate", "ai"]),
    ("Which clean energy sources can replace fossil fuels?", ["climate"]),
    ("Can machine learning or quantum simulation be applied to environmental problems?", ["climate", "quantum", "ai"]),
    # ===== Quantum =====
    ("What is a qubit?", ["quantum"]),
    ("What is quantum superposition?", ["quantum"]),
    ("What is quantum entanglement?", ["quantum"]),
    ("What is quantum decoherence?", ["quantum"]),
    ("What is Shor's algorithm?", ["quantum"]),
    ("What is Grover's algorithm?", ["quantum"]),
    ("How do ion traps confine atomic particles?", ["quantum"]),
    ("What is quantum advantage or supremacy?", ["quantum"]),
    ("How does a quantum Turing machine differ from a classical one?", ["quantum"]),
    ("What did Google's Willow chip achieve in 2024?", ["quantum"]),
    ("What is quantum key distribution?", ["quantum"]),
    ("How does wave interference amplify measurement outcomes?", ["quantum"]),
    ("What is the NISQ era and what comes after it?", ["quantum"]),
    ("How did Deutsch's algorithm demonstrate quantum parallelism?", ["quantum"]),
    ("Why did IBM dispute Google's quantum supremacy claim?", ["quantum"]),
    ("How are quantum states described mathematically?", ["quantum"]),
    ("Which computing approach can simulate quantum systems without exponential overhead?", ["quantum"]),
    ("How do probabilistic systems process information?", ["quantum", "ai"]),
    ("Which methods could break widely used encryption protocols?", ["quantum"]),
    ("How can advanced computation model uncertainty and physical phenomena?", ["quantum", "ai", "climate"]),
]

TOP_K = 5


def main():
    print(f"Running {len(LABELED)} labeled queries (top_k={TOP_K}) against real pipeline...\n")

    per_topic = defaultdict(lambda: {"n": 0, "hits": 0, "rr_sum": 0.0, "acc1": 0})
    totals = {"n": 0, "hits": 0, "rr_sum": 0.0, "acc1": 0}

    diffs = defaultdict(lambda: defaultdict(lambda: {"n": 0, "hits": 0, "rr_sum": 0.0, "acc1": 0}))

    for q, relevant in LABELED:
        results = search(query=q, top_k=TOP_K, score_threshold=0.0)

        # Map each retrieved chunk to its topic
        retrieved_topics = [topic_of(r.get("filename")) for r in results]

        # Count relevant hits among top-k
        hits = sum(1 for t in retrieved_topics if t in relevant)

        # Reciprocal rank: 1/(rank of first relevant chunk), else 0
        rr = 0.0
        for i, t in enumerate(retrieved_topics):
            if t in relevant:
                rr = 1.0 / (i + 1)
                break

        acc1 = 1.0 if retrieved_topics and retrieved_topics[0] in relevant else 0.0

        # Difficulty = easy if topic appears verbatim in query, else classify by label position
        # (approximate: hard if len(relevant) > 1, else easy/medium handled below)
        primary = relevant[0]
        per_topic[primary]["n"] += 1
        per_topic[primary]["hits"] += hits
        per_topic[primary]["rr_sum"] += rr
        per_topic[primary]["acc1"] += acc1

        totals["n"] += 1
        totals["hits"] += hits
        totals["rr_sum"] += rr
        totals["acc1"] += acc1

        # difficulty buckets: cross-topic => hard; else keyword-vs-paraphrase
        if len(relevant) > 1:
            diff = "hard"
        elif any(w in q.lower() for w in relevant if primary == "ai") or (
            primary != "ai" and primary in q.lower()
        ):
            diff = "easy"
        else:
            diff = "medium"
        diffs[diff][primary]["n"] += 1
        diffs[diff][primary]["hits"] += hits
        diffs[diff][primary]["rr_sum"] += rr
        diffs[diff][primary]["acc1"] += acc1

        # per-query detail
        print(f"  [{'/'.join(relevant):>14}] P@5={hits}/5  acc@1={int(acc1)}  RR={rr:.2f}  | {q}")

    def line(stats, label):
        n = stats["n"] or 1
        p5 = stats["hits"] / (n * TOP_K)
        mrr = stats["rr_sum"] / n
        a1 = stats["acc1"] / n
        print(f"{label:<26} n={stats['n']:<4} Precision@5={p5:.3f}  Accuracy@1={a1:.3f}  MRR={mrr:.3f}")
        return p5, mrr, a1

    print("\n===== Per-topic =====")
    for topic in ["ai", "climate", "quantum"]:
        line(per_topic[topic], f"Topic: {topic}")

    print("\n===== By difficulty =====")
    for diff in ["easy", "medium", "hard"]:
        agg = {"n": 0, "hits": 0, "rr_sum": 0.0, "acc1": 0}
        for t in agg:  # placeholders, recompute below
            pass
        # aggregate across topics for this difficulty
        n = hits = acc1 = 0
        rr_sum = 0.0
        for topic in ["ai", "climate", "quantum"]:
            d = diffs[diff][topic]
            n += d["n"]; hits += d["hits"]; acc1 += d["acc1"]; rr_sum += d["rr_sum"]
        if n:
            print(f"  {diff:<8} n={n:<4} Precision@5={hits/(n*TOP_K):.3f}  "
                  f"Accuracy@1={acc1/n:.3f}  MRR={rr_sum/n:.3f}")

    print("\n===== Overall =====")
    p5, mrr, a1 = line(totals, "ALL QUERIES")
    print(f"\nReport: Precision@5={p5:.3f}  Accuracy@1={a1:.3f}  MRR={mrr:.3f}  on {totals['n']} queries")


if __name__ == "__main__":
    main()
