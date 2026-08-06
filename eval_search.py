"""
Quick retrieval evaluation for the Semantic Search / RAG project.

Usage:
    pip install requests
    python eval_search.py

Make sure your backend is running first:
    python -m uvicorn backend.main:app --reload

If you've added extra topics beyond the original seed corpus, add matching
queries + expected source filenames to TEST_CASES below before running.
"""

import time
import requests

BASE_URL = "http://localhost:8000"
TOP_K = 5

# Each case: (query, expected source filename substring)
# Matches the original seed corpus. Edit/add rows if your corpus differs.
TEST_CASES = [
    ("how do neural networks learn from data", "neural_network"),
    ("what causes global temperatures to rise", "climate_change"),
    ("how do qubits work in quantum computers", "quantum_computing"),
    ("what training do astronauts go through", "astronaut"),
    ("missions to explore outer space", "space_exploration"),
    ("solar and wind power generation", "renewable_energy"),
    ("what happens at the event horizon of a black hole", "black_hole"),
    ("how do vaccines create immunity", "vaccine"),
    ("what is blockchain based digital currency", "cryptocurrency"),
    ("battery technology in electric cars", "electric_vehicle"),
    ("editing genes with CRISPR", "genetic_engineering"),
    ("rising CO2 levels affecting the ocean", "ocean_acidification"),
    ("protecting computer systems from attacks", "cybersecurity"),
    ("translating language automatically with AI", "machine_translation"),
    ("what is artificial intelligence", "artificial_intelligence"),
]


def evaluate():
    hits = 0
    total_latency = 0.0
    rows = []

    for query, expected in TEST_CASES:
        start = time.perf_counter()
        try:
            resp = requests.post(
                f"{BASE_URL}/search",
                json={"query": query, "top_k": TOP_K, "score_threshold": 0.0},
                timeout=15,
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            rows.append((query, expected, "ERROR", 0, f"{e}"))
            continue
        elapsed_ms = (time.perf_counter() - start) * 1000
        total_latency += elapsed_ms

        data = resp.json()
        results = data.get("results", [])

        sources = [
            (r.get("source") or r.get("filename") or "").lower().replace(" ", "_").replace("wikipedia:", "")
            for r in results
        ]
        hit = any(expected.lower() in s for s in sources)
        if hit:
            hits += 1

        top_score = results[0]["score"] if results else 0.0
        rows.append((query, expected, "HIT" if hit else "MISS", top_score, f"{elapsed_ms:.0f}ms"))

    n = len(TEST_CASES)
    precision_at_k = hits / n if n else 0.0
    avg_latency = total_latency / n if n else 0.0

    print(f"{'Query':45} {'Expected':22} {'Result':6} {'TopScore':9} {'Latency'}")
    print("-" * 95)
    for query, expected, result, score, latency in rows:
        print(f"{query[:44]:45} {expected:22} {result:6} {str(round(score,3)) if isinstance(score,float) else score:9} {latency}")

    print("\n" + "=" * 40)
    print(f"Precision@{TOP_K}:  {precision_at_k:.2%}  ({hits}/{n})")
    print(f"Avg latency:  {avg_latency:.0f}ms")
    print("=" * 40)


if __name__ == "__main__":
    evaluate()