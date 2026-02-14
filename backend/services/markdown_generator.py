import re
import unicodedata
from dataclasses import dataclass, field

from .epub_parser import Chapter, ParsedBook
from .clippings_parser import Clipping


@dataclass
class MatchedHighlight:
    text: str
    clip_type: str
    location: str
    page: int | None
    chapter_title: str | None


@dataclass
class ChapterResult:
    title: str
    level: int
    highlights: list[dict] = field(default_factory=list)


@dataclass
class GenerationResult:
    title: str
    author: str
    chapters: list[ChapterResult]
    markdown: str
    stats: dict


def _normalize_for_search(text: str) -> str:
    """Normalize text for fuzzy substring matching."""
    # Unicode-normalize to decompose fancy characters (e.g. ligatures, accents)
    text = unicodedata.normalize("NFKC", text)
    # Strip zero-width and other invisible Unicode characters
    text = re.sub(r"[\u200b-\u200f\u2028-\u202f\u2060\ufeff]", "", text)
    # Collapse whitespace
    text = " ".join(text.split())
    # Lowercase
    text = text.lower()
    # Normalize ALL common quote variants to ASCII
    text = text.replace("\u2018", "'").replace("\u2019", "'")   # curly single
    text = text.replace("\u201c", '"').replace("\u201d", '"')   # curly double
    text = text.replace("\u201a", "'").replace("\u201e", '"')   # low-9 quotes
    text = text.replace("\u2039", "'").replace("\u203a", "'")   # angle single
    text = text.replace("\u00ab", '"').replace("\u00bb", '"')   # guillemets
    text = text.replace("\u02bc", "'")                          # modifier apostrophe
    # Normalize ALL dash variants to ASCII hyphen
    text = text.replace("\u2014", "-").replace("\u2013", "-")   # em/en dash
    text = text.replace("\u2012", "-").replace("\u2015", "-")   # figure/horizontal
    text = text.replace("\u00ad", "")                           # soft hyphen
    # Remove non-alphanumeric except spaces (keep apostrophes)
    text = re.sub(r"[^\w\s']", " ", text)
    return " ".join(text.split())


STOP_WORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "its", "as", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can", "shall",
    "not", "no", "nor", "so", "if", "than", "that", "this", "these",
    "those", "then", "there", "their", "they", "them", "he", "she",
    "his", "her", "him", "we", "us", "our", "you", "your", "i", "me",
    "my", "who", "what", "which", "when", "where", "how", "all", "each",
    "every", "any", "some", "one", "two", "up", "out", "about", "into",
    "over", "after", "before", "just", "also", "more", "very", "even",
})


def _match_score(highlight_text: str, chapter_text: str) -> int:
    """Score how well a highlight matches a chapter.

    Returns:
        3 = direct substring match (best)
        2 = first+last N words found (good, handles truncation)
        1 = high word overlap (fallback for subtle char differences)
        0 = no match
    """
    norm_highlight = _normalize_for_search(highlight_text)
    norm_chapter = _normalize_for_search(chapter_text)

    if not norm_highlight or not norm_chapter:
        return 0

    # Direct substring match
    if norm_highlight in norm_chapter:
        return 3

    # Try matching with first and last N words (handles truncated highlights)
    words = norm_highlight.split()
    if len(words) >= 6:
        first_part = " ".join(words[:5])
        last_part = " ".join(words[-5:])
        if first_part in norm_chapter and last_part in norm_chapter:
            return 2

    # Word-overlap fallback: check if most significant words appear in chapter
    if len(words) >= 4:
        significant = [w for w in words if w not in STOP_WORDS and len(w) > 2]
        if significant:
            chapter_words = set(norm_chapter.split())
            found = sum(1 for w in significant if w in chapter_words)
            if found / len(significant) >= 0.8:
                return 1

    return 0


def _format_location(clipping: Clipping) -> str:
    """Format location/page info for display."""
    parts = []
    if clipping.page:
        parts.append(f"PAGE {clipping.page}")
    if clipping.location_start:
        if clipping.location_end and clipping.location_end != clipping.location_start:
            parts.append(f"LOCATION {clipping.location_start}-{clipping.location_end}")
        else:
            parts.append(f"LOCATION {clipping.location_start}")
    return " · ".join(parts) if parts else ""


def generate_markdown(book: ParsedBook, clippings: list[Clipping]) -> GenerationResult:
    """Match clippings to chapters and generate markdown output."""
    # Match each clipping to a chapter
    matched: list[tuple[Clipping, Chapter | None]] = []
    matched_count = 0
    orphaned_count = 0

    for clip in clippings:
        found_chapter = None
        best_score = 0
        for chapter in book.chapters:
            score = _match_score(clip.text, chapter.text)
            if score > best_score:
                best_score = score
                found_chapter = chapter
                if score == 3:
                    break  # Direct match is the best possible, stop early

        matched.append((clip, found_chapter))
        if found_chapter:
            matched_count += 1
        else:
            orphaned_count += 1

    total = len(clippings)
    match_rate = round((matched_count / total * 100), 1) if total > 0 else 0

    stats = {
        "total_highlights": total,
        "matched": matched_count,
        "orphaned": orphaned_count,
        "match_rate": match_rate,
    }

    # Group by chapter
    chapter_highlights: dict[str, list[tuple[Clipping, Chapter | None]]] = {}
    orphaned_clips: list[Clipping] = []

    for clip, chapter in matched:
        if chapter:
            key = chapter.title
            if key not in chapter_highlights:
                chapter_highlights[key] = []
            chapter_highlights[key].append((clip, chapter))
        else:
            orphaned_clips.append(clip)

    # Build chapter results in order
    chapter_results: list[ChapterResult] = []
    seen_chapters: set[str] = set()

    for chapter in book.chapters:
        if chapter.title in chapter_highlights and chapter.title not in seen_chapters:
            seen_chapters.add(chapter.title)
            cr = ChapterResult(title=chapter.title, level=chapter.level)
            for clip, _ in chapter_highlights[chapter.title]:
                cr.highlights.append({
                    "text": clip.text,
                    "type": clip.clip_type,
                    "location": _format_location(clip),
                    "page": clip.page,
                })
            chapter_results.append(cr)

    # Generate markdown
    md_lines: list[str] = []

    for cr in chapter_results:
        heading = "#" * min(cr.level + 1, 4)
        md_lines.append(f"{heading} {cr.title}")
        md_lines.append("")
        for h in cr.highlights:
            if h["type"] == "note":
                md_lines.append(f"- {h['text']}")
            else:
                md_lines.append(f'- "{h["text"]}"')
            meta_parts = []
            if h["location"]:
                meta_parts.append(h["location"])
            label = "ANNOTATION" if h["type"] == "note" else "HIGHLIGHT"
            meta_parts.append(label)
            if meta_parts:
                md_lines.append(f"  {' · '.join(meta_parts)}")
            md_lines.append("")

    if orphaned_clips:
        cr = ChapterResult(title="Unmatched Highlights", level=1)
        for clip in orphaned_clips:
            cr.highlights.append({
                "text": clip.text,
                "type": clip.clip_type,
                "location": _format_location(clip),
                "page": clip.page,
            })
        chapter_results.append(cr)

        md_lines.append(f"## Unmatched Highlights")
        md_lines.append("")
        for clip in orphaned_clips:
            if clip.clip_type == "note":
                md_lines.append(f"- {clip.text}")
            else:
                md_lines.append(f'- "{clip.text}"')
            meta_parts = []
            loc = _format_location(clip)
            if loc:
                meta_parts.append(loc)
            label = "ANNOTATION" if clip.clip_type == "note" else "HIGHLIGHT"
            meta_parts.append(label)
            md_lines.append(f"  {' · '.join(meta_parts)}")
            md_lines.append("")

    markdown = "\n".join(md_lines).strip() + "\n"

    return GenerationResult(
        title=book.title,
        author=book.author,
        chapters=chapter_results,
        markdown=markdown,
        stats=stats,
    )
