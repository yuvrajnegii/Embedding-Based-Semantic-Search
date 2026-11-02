# ===== NEW FILE  (create it in the project root, next to eval_precision.py) =====
# What it is: measures cache hit rate, wrong-hit rate and latency; sweeps the threshold.
# ======================================================================

"""
Evaluation harness for the semantic answer cache.

What it measures (no Groq calls are needed for the main part):
  - Hit rate on paraphrased questions (should be served from the cache)
  - Wrong-hit rate: a cached answer to a DIFFERENT question being served
  - A threshold sweep, so CACHE_THRESHOLD can be chosen from data
  - Latency of a cache hit (embed + lookup)
  - Optional (--groq N): median latency of a real cache miss on N queries,
    which needs GROQ_API_KEY and the document corpus to be loaded.

How it works: every "original" question is stored in a temporary cache
collection with a marker answer. Each probe question is then looked up and we
check which stored entry it matched and how similar the two questions were.

Run from the project root, with the backend server STOPPED (two processes
should not share the same ChromaDB folder):

    python eval_cache.py
    python eval_cache.py --groq 5
"""
import argparse
import statistics
import time

from backend import config

# Use a throwaway collection so the real cache is never touched.
config.CACHE_ENABLED = True
config.CACHE_COLLECTION = "answer_cache_eval"

from backend import cache                      # noqa: E402
from backend.search import embed_query         # noqa: E402

TOP_K = 5
SCORE_THRESHOLD = 0.0

# (id, original question, paraphrase that SHOULD be served the original's answer)
POSITIVES = [
    ("ai1", "What is artificial intelligence?", "Can you explain what AI is?"),
    ("ai2", "What is an AI winter?", "Explain the term AI winter."),
    ("ai3", "What is the transformer architecture?", "Explain the transformer architecture."),
    ("ai4", "What is a rational agent?", "Define a rational agent in AI."),
    ("ai5", "What is deep learning?", "Explain deep learning."),
    ("ai6", "What is machine learning?", "Can you describe machine learning?"),
    ("ai7", "What is reinforcement learning?", "Explain how reinforcement learning works."),
    ("cl1", "What is global warming?", "Explain what global warming means."),
    ("cl2", "What are greenhouse gases?", "Which gases are called greenhouse gases?"),
    ("cl3", "What is the Paris Agreement?", "Tell me about the Paris climate agreement."),
    ("cl4", "What is ocean acidification?", "Explain ocean acidification."),
    ("cl5", "What causes sea level rise?", "Why are sea levels rising?"),
    ("cl6", "What is the greenhouse effect?", "How does the greenhouse effect work?"),
    ("cl7", "What is climate change?", "Define climate change."),
    ("qc1", "What is quantum computing?", "Explain quantum computing in simple terms."),
    ("qc2", "What is a qubit?", "Define qubit."),
    ("qc3", "What is quantum entanglement?", "Explain entanglement in quantum mechanics."),
    ("qc4", "What is quantum supremacy?", "What does quantum supremacy mean?"),
    ("qc5", "What is superposition in quantum computing?", "How does superposition work in quantum computers?"),
    ("qc6", "What is quantum error correction?", "How does error correction work in quantum computers?"),
]

# Questions that are close to a stored one but ask for something different.
# A cache hit on any of these is a WRONG hit.
NEGATIVES = [
    "What is the history of artificial intelligence?",
    "What are the risks of artificial intelligence?",
    "What ended the AI winter?",
    "What are the limitations of the transformer architecture?",
    "What are the disadvantages of deep learning?",
    "What is not a rational agent?",
    "What does not cause global warming?",
    "Who signed the Paris Agreement?",
    "What are the effects of ocean acidification on coral reefs?",
    "What is the difference between global warming and climate change?",
    "What is classical computing?",
    "How do I build a qubit?",
    "What are the applications of quantum entanglement?",
    "What is the capital of France?",
    "How do I bake bread?",
    "Who won the 2018 World Cup?",
]

SWEEP = [0.80, 0.85, 0.88, 0.90, 0.92, 0.93, 0.94, 0.95, 0.97]


def top1(embedding):
    """Raw nearest stored question: (entry_id, cosine similarity)."""
    col = cache._get_cache()
    res = col.query(
        query_embeddings=[embedding],
        n_results=1,
        where={"settings": cache._settings_key(TOP_K, SCORE_THRESHOLD)},
        include=["documents", "distances"],
    )
    import json
    payload = json.loads(res["documents"][0][0])
    return payload["answer"], 1.0 - res["distances"][0][0]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--groq", type=int, default=0,
                        help="also time N real cache misses (needs GROQ_API_KEY)")
    args = parser.parse_args()

    cache.clear()
    chunk = [{"chunk_id": "eval", "text": "eval", "score": 1.0, "filename": "eval.txt"}]

    print(f"Storing {len(POSITIVES)} original questions...")
    for qid, original, _ in POSITIVES:
        cache.store(original, embed_query(original), TOP_K, SCORE_THRESHOLD,
                    f"ANSWER::{qid}", ["eval.txt"], chunk)

    # Probe every paraphrase and every negative against the stored questions.
    pos_rows = []   # (correct_entry, similarity)
    for qid, _, paraphrase in POSITIVES:
        answer, sim = top1(embed_query(paraphrase))
        pos_rows.append((answer == f"ANSWER::{qid}", sim, paraphrase, answer))

    neg_rows = []   # similarity to nearest stored question
    for question in NEGATIVES:
        answer, sim = top1(embed_query(question))
        neg_rows.append((sim, question, answer))

    print(f"\nProbes: {len(POSITIVES)} paraphrases (should hit), "
          f"{len(NEGATIVES)} different questions (should miss)\n")
    header = f"{'threshold':>9} | {'paraphrase hit rate':>19} | {'wrong hits':>10} | {'share of hits that are wrong':>28}"
    print(header)
    print("-" * len(header))
    for t in SWEEP:
        correct = sum(1 for ok, sim, *_ in pos_rows if ok and sim >= t)
        wrong_pos = sum(1 for ok, sim, *_ in pos_rows if (not ok) and sim >= t)
        wrong_neg = sum(1 for sim, *_ in neg_rows if sim >= t)
        wrong = wrong_pos + wrong_neg
        served = correct + wrong
        hit_rate = correct / len(POSITIVES)
        wrong_share = wrong / served if served else 0.0
        marker = "  <- current" if abs(t - config.CACHE_THRESHOLD) < 1e-9 else ""
        print(f"{t:>9.2f} | {hit_rate:>18.1%} | {wrong:>10d} | {wrong_share:>27.1%}{marker}")

    print("\nClosest different-question probes (the ones a threshold must stay above):")
    for sim, question, _ in sorted(neg_rows, reverse=True)[:5]:
        print(f"  {sim:.3f}  {question}")
    print("\nLowest-similarity paraphrases (the ones a threshold must stay below):")
    for ok, sim, paraphrase, _ in sorted(pos_rows, key=lambda r: r[1])[:5]:
        print(f"  {sim:.3f}  {paraphrase}")

    # Latency of a hit: embed + lookup, using the configured threshold.
    timings = []
    for _, _, paraphrase in POSITIVES:
        start = time.perf_counter()
        emb = embed_query(paraphrase)
        cache.lookup(emb, TOP_K, SCORE_THRESHOLD)
        timings.append((time.perf_counter() - start) * 1000)
    print(f"\nCache-hit path (embed + lookup): median {statistics.median(timings):.1f} ms, "
          f"max {max(timings):.1f} ms over {len(timings)} queries")

    if args.groq:
        from backend.search import search
        from backend.generate import generate_answer
        miss_times = []
        for _, original, _ in POSITIVES[: args.groq]:
            start = time.perf_counter()
            emb = embed_query(original)
            chunks = search(original, TOP_K, SCORE_THRESHOLD, query_embedding=emb)
            generate_answer(original, chunks)
            miss_times.append((time.perf_counter() - start) * 1000)
        print(f"Cache-miss path (embed + retrieve + Groq): median "
              f"{statistics.median(miss_times):.0f} ms over {len(miss_times)} queries")

    cache.clear()
    print("\nTemporary eval cache removed.")
    print("Note: these numbers come from a small hand-written set, so treat them as "
          "indicative and pick CACHE_THRESHOLD with that in mind.")


if __name__ == "__main__":
    main()
