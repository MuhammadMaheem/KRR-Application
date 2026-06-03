import pdfplumber
import os
import re
from typing import Optional


def _clean_text(text: str) -> str:
    # Fix hyphenated line-breaks: "con-\ntinuous" → "continuous"
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    # Collapse 3+ blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse runs of spaces/tabs
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


def _extract_page_text(page) -> str:
    """
    Column-aware text extraction.
    Detects two-column layout by word x-position distribution,
    then extracts left column first, right column second.
    Falls back to standard extract_text for single-column pages.
    """
    words = page.extract_words(x_tolerance=1, y_tolerance=3)
    if not words:
        return ""

    page_width = page.width
    mid = page_width / 2

    # Check if there is a meaningful gap near the middle (two-column indicator).
    # Count words in left vs right half.
    left_words = [w for w in words if w["x1"] < mid * 1.1]
    right_words = [w for w in words if w["x0"] > mid * 0.9]

    # If both halves have substantial content, treat as two-column.
    is_two_col = (len(left_words) > 10 and len(right_words) > 10 and
                  abs(len(left_words) - len(right_words)) < max(len(left_words), len(right_words)) * 0.8)

    if is_two_col:
        # Hard split at midpoint
        left = [w for w in words if w["x0"] < mid]
        right = [w for w in words if w["x0"] >= mid]
        text = _words_to_text(left) + "\n" + _words_to_text(right)
    else:
        text = _words_to_text(words)

    return text


def _words_to_text(words: list) -> str:
    """Reconstruct text from word list by grouping into lines by y-position."""
    if not words:
        return ""

    # Sort by top position, then left position
    words = sorted(words, key=lambda w: (round(w["top"] / 4) * 4, w["x0"]))

    lines = []
    current_line: list = []
    current_y: Optional[float] = None
    LINE_THRESH = 6  # px — words within this vertical distance = same line

    for w in words:
        y = w["top"]
        if current_y is None or abs(y - current_y) <= LINE_THRESH:
            current_line.append(w["text"])
            current_y = y
        else:
            lines.append(" ".join(current_line))
            current_line = [w["text"]]
            current_y = y

    if current_line:
        lines.append(" ".join(current_line))

    return "\n".join(lines)


def _fix_smashed_words(text: str) -> str:
    """Best-effort space insertion for PDFs that encode chars with no space glyphs."""
    # camelCase boundary: lowercase→uppercase (DevOpsis → Dev Ops is)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    # letter/digit boundaries
    text = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', text)
    text = re.sub(r'(\d)([a-zA-Z])', r'\1 \2', text)
    # dot/comma immediately followed by uppercase with no space
    text = re.sub(r'([.,;:])([A-Za-z])', r'\1 \2', text)
    return text


def _extract_abstract(page_text: str) -> Optional[str]:
    """Heuristic: find 'abstract' section on first page."""
    lower = page_text.lower()
    idx = lower.find('abstract')
    if idx == -1:
        return page_text[:500].strip() if page_text else None

    start = idx + len('abstract')
    while start < len(page_text) and page_text[start] in ':\n\r —-\t ':
        start += 1

    snippet = page_text[start:start + 1500]
    intro_match = re.search(r'\n\s*(?:1[\.\s]|introduction|keywords?|index terms)', snippet, re.IGNORECASE)
    if intro_match:
        snippet = snippet[:intro_match.start()]

    return _clean_text(snippet)[:800] or None


def extract_pdf(file_path: str) -> dict:
    result = {
        "title": None,
        "authors": [],
        "abstract": None,
        "content": "",
        "page_count": 0,
        "file_size": os.path.getsize(file_path),
    }

    with pdfplumber.open(file_path) as pdf:
        result["page_count"] = len(pdf.pages)

        meta = pdf.metadata or {}
        raw_title = meta.get("Title", "").strip()
        raw_author = meta.get("Author", "").strip()

        if raw_title and len(raw_title) > 3:
            result["title"] = raw_title

        if raw_author:
            result["authors"] = [a.strip() for a in re.split(r'[,;]', raw_author) if a.strip()]

        pages_text = []
        for page in pdf.pages:
            text = _extract_page_text(page)
            pages_text.append(text)

        full_text = "\n\n".join(pages_text)
        result["content"] = _clean_text(full_text)

        if not result["title"] and pages_text:
            first_lines = [l.strip() for l in pages_text[0].split('\n') if l.strip()]
            if first_lines:
                result["title"] = first_lines[0][:200]

        if pages_text:
            result["abstract"] = _extract_abstract(pages_text[0])

    return result
