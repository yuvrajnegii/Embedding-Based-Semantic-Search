"""
Downloads a small, curated set of Wikipedia articles as .txt files
into data/raw/, ready for the ingestion pipeline.
 
Usage:
    pip install wikipedia
    python download_wikipedia.py
"""
 
import os
import wikipedia
 
# Pick a spread of topics so semantic (not keyword) search is easy to demonstrate.
TOPICS = [
    "Artificial intelligence",
    "Climate change",
    "Quantum computing",
    "Astronaut",
    "Space exploration",
    "Renewable energy",
    "Neural network",
    "Black hole",
    "Vaccine",
    "Cryptocurrency",
    "Electric vehicle",
    "Genetic engineering",
    "Ocean acidification",
    "Cybersecurity",
    "Machine translation",
]
 
OUTPUT_DIR = "data/raw"
 
 
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    wikipedia.set_lang("en")
 
    for topic in TOPICS:
        try:
            page = wikipedia.page(topic, auto_suggest=False)
            filename = topic.lower().replace(" ", "_") + ".txt"
            filepath = os.path.join(OUTPUT_DIR, filename)
 
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(page.content)
 
            print(f"  Saved: {filename} ({len(page.content)} chars)")
 
        except wikipedia.exceptions.DisambiguationError as e:
            print(f"  Skipped (ambiguous): {topic} -> try one of {e.options[:3]}")
        except wikipedia.exceptions.PageError:
            print(f"  Skipped (not found): {topic}")
        except Exception as e:
            print(f"  Skipped ({topic}): {e}")
 
    print(f"\nDone. Articles saved to {OUTPUT_DIR}/")
 
 
if __name__ == "__main__":
    main()