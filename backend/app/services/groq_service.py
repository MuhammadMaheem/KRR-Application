from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


PRIMARY_MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"

SUMMARY_PROMPT = """You are a research paper analyst. Analyze the paper content below and produce a structured summary using EXACTLY these section headers in markdown bold:

**Contributions:** List 2-4 key contributions as bullet points.
**Methodology:** Describe the approach, techniques, datasets, and tools used.
**Results:** Key findings, metrics, benchmarks, or performance numbers.
**Limitations:** Acknowledged weaknesses, scope gaps, or future work.
**Keywords:** 5-8 relevant topic keywords, comma-separated.

Be concise and precise. Use the paper's own language where possible.

Paper content:
{content}"""

COMPARATIVE_PROMPT = """You are a research synthesis expert. Compare the following {n} research papers.

Produce a structured comparative analysis with:
1. **Overview Table** — markdown table with columns: Paper, Main Contribution, Methodology, Key Results, Limitations
2. **Thematic Comparison** — 3-5 paragraphs discussing similarities, differences, and complementary aspects
3. **Strengths & Weaknesses** — brief bullet list for each paper
4. **Synthesis** — 1-2 paragraphs on how these papers relate to each other and the field

Papers:
{papers}"""

SYNTHETIC_REVIEW_PROMPT = """You are an academic researcher writing a literature review. Based on the following {n} papers, write a comprehensive synthetic literature review.

Structure your review with:
# Introduction
Brief overview of the research area and why these papers are relevant.

# Key Themes and Findings
Synthesize major themes across papers, not paper-by-paper summaries.

# Methodological Approaches
Compare research methods, datasets, evaluation metrics.

# Research Gaps and Open Problems
Identify what is missing, underexplored, or contradictory across the literature.

# Conclusion
Summary of the state of the field based on these papers.

Papers:
{papers}"""


def _format_papers_for_prompt(papers: list[dict]) -> str:
    parts = []
    for i, p in enumerate(papers, 1):
        parts.append(
            f"--- Paper {i}: {p['title']} ---\n"
            f"Authors: {', '.join(p.get('authors', [])) or 'Unknown'}\n\n"
            f"{p.get('summary') or p.get('content', '')[:3000]}"
        )
    return "\n\n".join(parts)


def generate_summary(content: str) -> str:
    truncated = content[:8000]
    prompt = SUMMARY_PROMPT.format(content=truncated)
    client = get_client()
    response = client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def generate_comparative(papers: list[dict]) -> str:
    formatted = _format_papers_for_prompt(papers)
    prompt = COMPARATIVE_PROMPT.format(n=len(papers), papers=formatted)
    client = get_client()
    response = client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2048,
    )
    return response.choices[0].message.content.strip()


def generate_synthetic_review(papers: list[dict]) -> str:
    formatted = _format_papers_for_prompt(papers)
    prompt = SYNTHETIC_REVIEW_PROMPT.format(n=len(papers), papers=formatted)
    client = get_client()
    response = client.chat.completions.create(
        model=PRIMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=3000,
    )
    return response.choices[0].message.content.strip()
