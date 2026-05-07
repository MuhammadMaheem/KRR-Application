import json
from groq import Groq
from app.core.config import settings

# Initialize Groq client - reads GROQ_API_KEY from environment
groq_api_key = settings.GROQ_API_KEY

if not groq_api_key:
    print("⚠️  WARNING: GROQ_API_KEY environment variable not set!")
    print("   Get your free API key at: https://console.groq.com/keys")
    print("   Then set it in your .env file: GROQ_API_KEY=gsk_your_key")

client = Groq(api_key=groq_api_key) if groq_api_key else None

# Model priority: fast/cheap first for extraction; quality model for generation
# Groq free tier limit: ~6k tokens/request for 70b, ~14k for 8b
EXTRACT_MODEL   = "llama-3.1-8b-instant"     # Primary for extraction (low token cost)
GENERATE_MODEL  = "llama-3.3-70b-versatile"   # Primary for lit-review generation
FALLBACK_MODEL  = "llama-3.1-8b-instant"      # Universal fallback

# Conservative context budgets (chars) to stay well under token limits
EXTRACT_CONTEXT  = 4000   # ~1k tokens — safe for any plan/model
COMPARE_CONTEXT  = 2000   # ~500 tokens per paper
REVIEW_CONTEXT   = 800    # ~200 tokens per paper summary


def _parse_json_response(response_text: str) -> dict:
    """Strip markdown code fences and parse JSON from a model response."""
    cleaned = response_text.strip()
    # Strip ```json ... ``` or ``` ... ``` wrappers
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


def _call_groq(messages: list, max_tokens: int = 2048, primary_model: str = None) -> str:
    """
    Call Groq API with automatic model fallback on 413 / rate limit errors.
    Returns the raw response text from the model.
    """
    p_model = primary_model or EXTRACT_MODEL
    
    for model in (p_model, FALLBACK_MODEL):
        try:
            print(f"📡 Calling Groq API ({model})...")
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.3,
                max_tokens=max_tokens,
            )
            text = response.choices[0].message.content
            print(f"✅ Groq response received: {len(text)} chars (model: {model})")
            return text
        except Exception as e:
            err = str(e)
            # 413 = request too large, try next model
            if "413" in err or "too large" in err.lower() or "rate_limit" in err.lower():
                print(f"⚠️  Model {model} failed ({err[:80]}), trying fallback...")
                continue
            # Any other error — propagate immediately
            raise
    raise RuntimeError(
        f"All models failed. Last error context: check your GROQ_API_KEY and internet connection."
    )


async def analyze_paper(text: str) -> dict:
    """Analyze a single paper using Groq API and return structured JSON."""
    print("🧠 Sending PDF text to Groq API for analysis...")

    if not client:
        return {
            "key_contributions": "❌ GROQ_API_KEY not configured — add it to your .env file",
            "research_problem": "Set GROQ_API_KEY=gsk_... in your .env file",
            "methodology": "Get a free key at https://console.groq.com/keys",
            "results": "Restart the backend after setting the key",
            "limitations": "No API key provided",
            "gaps": ["Configure GROQ_API_KEY to enable analysis"],
            "keywords": []
        }

    context = text[:EXTRACT_CONTEXT]

    system_msg = "You are an expert academic research analyst. Always respond with valid JSON only — no markdown, no extra text."
    user_msg = f"""Analyze the following academic paper text and extract information in this exact JSON format:
{{
    "key_contributions": "Bullet-point list of the paper's main contributions and novel ideas.",
    "research_problem": "The specific problem or research question the paper addresses.",
    "methodology": "The research methodology, datasets, experimental setup, and algorithms used.",
    "results": "The quantitative and qualitative findings and performance metrics reported.",
    "limitations": "Explicitly stated limitations, weaknesses, or threats to validity.",
    "gaps": ["Identified research gap 1", "Identified research gap 2", "Identified research gap 3"],
    "keywords": ["Keyword1", "Keyword2", "Keyword3"]
}}

Paper text:
{context}

Return ONLY valid JSON. Do not wrap in code fences."""

    try:
        response_text = _call_groq([
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ], primary_model=EXTRACT_MODEL)
        result = _parse_json_response(response_text)
        return result

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return {
            "key_contributions": "⚠️ The AI returned a malformed response. Please try re-uploading.",
            "research_problem": "JSON parse error — the model response was not valid JSON.",
            "methodology": "Unable to extract — retry may resolve this.",
            "results": "Unable to extract — retry may resolve this.",
            "limitations": "Unable to extract — retry may resolve this.",
            "gaps": ["Retry the upload to attempt re-analysis"],
            "keywords": []
        }
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return {
            "key_contributions": f"❌ API Error: {str(e)[:200]}",
            "research_problem": "The AI service returned an error.",
            "methodology": "Check backend logs for details.",
            "results": "Check backend logs for details.",
            "limitations": "Check backend logs for details.",
            "gaps": [],
            "keywords": []
        }


async def compare_papers(text1: str, text2: str) -> dict:
    """Compare two papers and return structured JSON with similarities, differences, etc."""
    print("🧠 Comparing papers via Groq API...")

    if not client:
        return {
            "similarities": "❌ GROQ_API_KEY not configured",
            "differences": "Set GROQ_API_KEY in your .env file",
            "complementary_aspects": "Get a free key at https://console.groq.com/keys",
            "combined_insights": "Restart the backend after setting the key"
        }

    # Use half the context budget for each paper
    half_context = COMPARE_CONTEXT // 2
    context1 = text1[:half_context]
    context2 = text2[:half_context]

    system_msg = "You are an expert academic research analyst. Always respond with valid JSON only — no markdown, no extra text."
    user_msg = f"""Compare the following two academic papers and provide a structured analysis in this exact JSON format:
{{
    "similarities": "What core themes, methods, or goals do these papers share?",
    "differences": "What are the key differences in approach, scope, findings, or methodology?",
    "complementary_aspects": "How do these papers complement each other? What does each add that the other lacks?",
    "combined_insights": "What new or broader insights emerge from reading both papers together?"
}}

Paper 1:
{context1}

Paper 2:
{context2}

Return ONLY valid JSON. Do not wrap in code fences."""

    try:
        response_text = _call_groq([
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ], primary_model=GENERATE_MODEL)
        return _parse_json_response(response_text)

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")

        def _extract_line(prefix: str, text: str) -> str:
            for line in text.splitlines():
                if line.lower().startswith(prefix.lower()):
                    return line.split(":", 1)[1].strip() if ":" in line else line.strip()
            return "N/A"

        title1 = _extract_line("Title", text1)
        title2 = _extract_line("Title", text2)
        rp1 = _extract_line("Research Problem", text1)
        rp2 = _extract_line("Research Problem", text2)

        return {
            "similarities": (
                f"Both documents ({title1} and {title2}) address related research themes and can be analyzed under the same review objective."
            ),
            "differences": (
                f"Research focus diverges between papers: Paper 1 centers on '{rp1[:180]}', while Paper 2 emphasizes '{rp2[:180]}'."
            ),
            "complementary_aspects": (
                "The papers appear complementary: one contributes perspective on problem framing while the other adds alternate methods/results context."
            ),
            "combined_insights": (
                "A combined reading supports a broader synthesis path: merge both viewpoints into a unified review narrative and identify where evidence converges or conflicts."
            )
        }
    except Exception as e:
        print(f"❌ Groq API Error: {e}")
        return {
            "similarities": f"❌ API Error: {str(e)[:200]}",
            "differences": "The AI service returned an error — check backend logs.",
            "complementary_aspects": "",
            "combined_insights": ""
        }


async def generate_literature_review(topic: str, papers_data: list) -> dict:
    """
    Generate a structured academic literature review from a topic and list of paper summaries.
    Returns a dict with: title, introduction, related_work, research_gaps, conclusion.
    """
    print(f"🧠 Generating literature review for topic '{topic}' from {len(papers_data)} papers...")

    if not client:
        return {
            "title": "Literature Review — API Key Missing",
            "introduction": "❌ GROQ_API_KEY not configured. Add it to your .env file.",
            "related_work": "Get a free key at https://console.groq.com/keys",
            "research_gaps": "Restart the backend after setting the key.",
            "conclusion": "No literature review generated."
        }

    # Build a compact per-paper summary string for the prompt
    paper_summaries = []
    for i, paper in enumerate(papers_data[:6], 1):  # Cap at 6 papers
        if isinstance(paper, dict):
            deep = paper.get("deep_analysis", {}) or {}
            summary = (
                f"Paper {i}: {paper.get('title', 'Unknown Title')}\n"
                f"  Authors: {paper.get('authors', 'Unknown')}\n"
                f"  Research Problem: {deep.get('research_problem', 'N/A')}\n"
                f"  Methodology: {str(deep.get('methodology', 'N/A'))[:300]}\n"
                f"  Results: {str(deep.get('results', 'N/A'))[:300]}\n"
                f"  Limitations: {str(deep.get('limitations', 'N/A'))[:200]}"
            )
        else:
            summary = f"Paper {i}: {str(paper)[:500]}"
        paper_summaries.append(summary)

    context_string = "\n\n".join(paper_summaries)

    system_msg = "You are an expert academic writer specializing in systematic literature reviews. Always respond with valid JSON only — no markdown, no extra text."
    user_msg = f"""Write a structured academic literature review on the topic: "{topic}"

Use ONLY the information from the papers listed below. Do not introduce external knowledge.

Papers:
{context_string}

Return your response as this exact JSON format:
{{
    "title": "A descriptive title for this literature review",
    "introduction": "2-3 paragraphs introducing the topic, its importance, and scope of this review.",
    "related_work": "3-4 paragraphs summarizing each paper's contribution and how they relate to each other and the topic.",
    "research_gaps": "2-3 paragraphs identifying gaps, contradictions, or underexplored areas in the existing literature.",
    "conclusion": "1-2 paragraphs summarizing findings and suggesting future research directions."
}}

Return ONLY valid JSON. Do not wrap in code fences."""

    try:
        response_text = _call_groq([
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ], max_tokens=3000, primary_model=GENERATE_MODEL)
        return _parse_json_response(response_text)

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error in literature review: {e}")
        return {
            "title": "Literature Review — Parse Error",
            "introduction": "⚠️ The AI returned a malformed response. Please try again.",
            "related_work": "JSON parse error — the model response was not valid JSON.",
            "research_gaps": "Retry may resolve this.",
            "conclusion": ""
        }
    except Exception as e:
        print(f"❌ Groq API Error in literature review: {e}")
        return {
            "title": "Literature Review — API Error",
            "introduction": f"❌ API Error: {str(e)[:200]}",
            "related_work": "Check backend logs for details.",
            "research_gaps": "",
            "conclusion": ""
        }
