import re
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Clipping:
    book_title: str
    author: str
    text: str
    clip_type: str  # "highlight", "note", "bookmark"
    page: int | None
    location_start: int | None
    location_end: int | None
    date: str | None


ENTRY_SEPARATOR = "=========="

# Matches: "- Your Highlight on page 42 | location 645-648 | Added on ..."
# or: "- Your Highlight on location 645-648 | Added on ..."
# or: "- Your Note on page 42 | location 645 | Added on ..."
META_RE = re.compile(
    r"- Your (?P<type>Highlight|Note|Bookmark)"
    r"(?: on page (?P<page>\d+))?"
    r"(?: \| )?"
    r"(?:[Ll]ocation (?P<loc_start>\d+)(?:-(?P<loc_end>\d+))?)?"
    r"(?: \| Added on (?P<date>.+))?",
    re.IGNORECASE,
)

# Matches: "Book Title (Author Name)"
TITLE_RE = re.compile(r"^(?P<title>.+?)\s*\((?P<author>[^)]+)\)\s*$")


def _normalize_title(title: str) -> str:
    """Normalize a title for fuzzy comparison."""
    title = title.lower().strip()
    # Remove leading/trailing punctuation and articles
    title = re.sub(r"^(the|a|an)\s+", "", title)
    # Remove non-alphanumeric except spaces
    title = re.sub(r"[^\w\s]", "", title)
    return " ".join(title.split())


def _titles_match(clip_title: str, epub_title: str) -> bool:
    """Check if a clipping title matches the epub title (fuzzy)."""
    norm_clip = _normalize_title(clip_title)
    norm_epub = _normalize_title(epub_title)
    if not norm_clip or not norm_epub:
        return False
    # Exact normalized match
    if norm_clip == norm_epub:
        return True
    # One contains the other
    if norm_clip in norm_epub or norm_epub in norm_clip:
        return True
    return False


def parse_clippings(text: str, filter_title: str | None = None) -> list[Clipping]:
    """Parse Kindle My Clippings.txt content.

    Args:
        text: The raw text content of My Clippings.txt
        filter_title: If provided, only return clippings whose book title matches this.

    Returns:
        List of parsed Clipping objects.
    """
    entries = text.split(ENTRY_SEPARATOR)
    clippings: list[Clipping] = []

    for entry in entries:
        lines = [line.strip() for line in entry.strip().splitlines() if line.strip()]
        if len(lines) < 2:
            continue

        # First line: "Book Title (Author Name)" or just "Book Title"
        title_line = lines[0]
        # Strip BOM if present
        title_line = title_line.lstrip("\ufeff")
        title_match = TITLE_RE.match(title_line)
        if title_match:
            book_title = title_match.group("title").strip()
            author = title_match.group("author").strip()
        else:
            book_title = title_line.strip()
            author = ""

        # Second line: metadata
        meta_line = lines[1]
        meta_match = META_RE.search(meta_line)
        if not meta_match:
            continue

        clip_type_raw = meta_match.group("type").lower()
        clip_type = clip_type_raw  # "highlight", "note", or "bookmark"
        page = int(meta_match.group("page")) if meta_match.group("page") else None
        loc_start = int(meta_match.group("loc_start")) if meta_match.group("loc_start") else None
        loc_end = int(meta_match.group("loc_end")) if meta_match.group("loc_end") else None
        date_str = meta_match.group("date").strip() if meta_match.group("date") else None

        # Remaining lines: the highlight/note text
        highlight_text = "\n".join(lines[2:]).strip()

        # Skip bookmarks (no text content) and empty highlights
        if clip_type == "bookmark" or not highlight_text:
            continue

        clipping = Clipping(
            book_title=book_title,
            author=author,
            text=highlight_text,
            clip_type=clip_type,
            page=page,
            location_start=loc_start,
            location_end=loc_end,
            date=date_str,
        )

        if filter_title and not _titles_match(book_title, filter_title):
            continue

        clippings.append(clipping)

    return clippings
