# Rebuild yuvrajnegi-cv as an ATS-safe PDF: plain text, full contact info,
# no en-dash corruption (which broke date parsing + bullets in the original).
import fitz

W, H = 595, 842          # A4
ML = 42                   # left/right margin
MR = W - 42
TOP = 38

NAVY = (0.16, 0.30, 0.48)
BODY = (0.11, 0.11, 0.12)
GRAY = (0.35, 0.35, 0.35)
LINE = (0.82, 0.85, 0.89)

doc = fitz.open()
page = doc.new_page(width=W, height=H)

def used_bottom():
    blocks = page.get_text('dict')['blocks']
    m = TOP
    for b in blocks:
        for l in b.get('lines', []):
            m = max(m, l['bbox'][3])
    return m

def put(text, y, size, font='helv', color=BODY, align=0):
    rect = fitz.Rect(ML, y, MR, H)
    page.insert_textbox(rect, text, fontsize=size, fontname=font, color=color,
                        align=align, lineheight=1.32)
    return used_bottom() + 5

def rule(y, color=LINE):
    page.draw_line(fitz.Point(ML, y), fitz.Point(MR, y), color=color, width=0.6)
    return y + 8

def section(title, y):
    page.insert_text(fitz.Point(ML, y), title, fontsize=11.5, fontname='hebo', color=NAVY)
    page.draw_line(fitz.Point(ML, y + 3), fitz.Point(MR, y + 3), color=LINE, width=0.6)
    return y + 9

Y = TOP

# ---- Header ----
page.insert_textbox(fitz.Rect(ML, Y, MR, Y + 30), "Yuvraj Negi",
                    fontsize=19, fontname='hebo', color=(0.05, 0.05, 0.05), align=1)
Y = used_bottom() + 2
page.insert_textbox(fitz.Rect(ML, Y, MR, Y + 18), "Machine Learning / AI Engineer",
                    fontsize=11, fontname='hebo', color=NAVY, align=1)
Y = used_bottom() + 2
page.insert_textbox(fitz.Rect(ML, Y, MR, Y + 20),
                    "Uttarakhand, India  |  +91 8395068516  |  yuvrajnegi2101@gmail.com  |  "
                    "linkedin.com/in/yuvraj-negi-  |  github.com/yuvrajnegii",
                    fontsize=8.6, fontname='helv', color=GRAY, align=1)
Y = used_bottom() + 6
rule(Y)
Y += 4

# ---- Summary ----
Y = section("PROFESSIONAL SUMMARY", Y)
summary = (
    "Machine Learning / AI Engineer building end-to-end ML and Retrieval-Augmented Generation (RAG) "
    "pipelines in Python - from data preprocessing, feature engineering, and model evaluation to API "
    "deployment (FastAPI) on cloud (GCP, AWS).\n"
    "• Designed a full-stack RAG search engine with Sentence-Transformers embeddings, a ChromaDB vector "
    "database, and Large Language Model (LLM) integration, achieving 86.67% precision@5 on a 508-chunk "
    "retrieval benchmark.\n"
    "• Built supervised machine learning classifiers for phishing URL detection and NLP sentiment/topic "
    "analysis tools processing 8,000+ videos.\n"
    "• Proficient in Python, SQL, Pandas, NumPy, Scikit-learn, and LLM APIs (Anthropic Claude, Groq); "
    "pursuing a B.Tech in Computer Science (expected 2027)."
)
Y = put(summary, Y, 9.4)

# ---- Education ----
Y = section("EDUCATION", Y)
Y = put("B.Tech in Computer Science - Graphic Era University    |    2023 - 2027 (Expected)", Y, 9.6, font='hebo')
Y = put("Higher Secondary (Class XII) - The Indian Academy    |    2022 - 2023", Y, 9.6)

# ---- Skills ----
Y = section("TECHNICAL SKILLS", Y)
skills = [
    ("Programming Languages:", "Python, Java, C, HTML, CSS, JavaScript, SQL"),
    ("ML & Data Libraries:", "Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn"),
    ("ML & AI Concepts:", "Machine Learning, Retrieval-Augmented Generation (RAG), LLM integration, "
        "embeddings, vector databases, data cleaning, preprocessing, feature engineering, model evaluation, "
        "exploratory data analysis (EDA), fraud detection, sentiment analysis, data visualization"),
    ("Developer Tools:", "Git, GitHub, Jupyter Notebooks, FastAPI, REST API, PyMuPDF"),
    ("Cloud & AI Platforms:", "Google Cloud Platform (GCP), Amazon Web Services (AWS), Anthropic Claude API, Groq"),
]
for label, val in skills:
    page.insert_text(fitz.Point(ML, Y), label, fontsize=9.4, fontname='hebo', color=BODY)
    lw = fitz.get_text_length(label + " ", fontname='hebo', fontsize=9.4)
    page.insert_textbox(fitz.Rect(ML + lw, Y - 8, MR, H), val, fontsize=9.4, fontname='helv', color=BODY)
    Y = used_bottom() + 4

# ---- Projects ----
Y = section("PROJECTS", Y)
projects = [
    ("Semantic Search & RAG Engine  -  Python, FastAPI, React, ChromaDB",
     ["Engineered a full-stack Retrieval-Augmented Generation (RAG) application (FastAPI + React/Tailwind) "
      "with a ChromaDB vector database and a token-aware chunking/embedding pipeline (Sentence-Transformers).",
      "Built on-demand document ingestion (Wikipedia topics + PDF upload via PyMuPDF) and streaming RAG Q&A "
      "using Groq Llama 3.1 (LLM integration) across 8 REST API endpoints.",
      "Achieved 86.67% precision@5 on a 15-query hand-labeled retrieval benchmark spanning a 508-chunk corpus.",
      "github.com/yuvrajnegii/Embedding-Based-Semantic-Search"]),
    ("Machine Learning-Powered Phishing URL Detector",
     ["Built a supervised machine learning classification model to detect phishing URLs using lexical and "
      "domain-based feature engineering.",
      "Trained and evaluated multiple ML models with Scikit-learn, achieving high precision and recall.",
      "github.com/yuvrajnegii/Phishtackle"]),
    ("YouTube Sentiment and Topic Analysis Tool",
     ["Built an end-to-end NLP pipeline processing 8,000 videos across 4 major news channels via the YouTube "
      "Data API, applying regex-based topic detection across 6 tracked political topics.",
      "Identified 2,411 topic-relevant videos (30.1% of corpus) and scored each for sentiment using NLTK VADER.",
      "Visualized sentiment distribution and per-channel, per-topic trends with Pandas, Seaborn, and Matplotlib.",
      "github.com/yuvrajnegii/Sentiment-analysis"]),
]
for title, bullets in projects:
    Y = put(title, Y, 9.8, font='hebo', color=NAVY)
    for b in bullets:
        Y = put("- " + b, Y, 9.3)

# ---- Certificates ----
Y = section("CERTIFICATES", Y)
Y = put("AWS Cloud Practitioner Essentials - Amazon Web Services (AWS)    |    Mar 2025", Y, 9.5, font='hebo')
Y = put("Claude with the Anthropic API - Anthropic    |    Apr 2026", Y, 9.5)

out = "yuvrajnegi-cv-v2.pdf"
doc.save(out)
print("saved", out, "pages", len(doc))
