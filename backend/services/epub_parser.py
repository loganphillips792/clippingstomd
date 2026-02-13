import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from dataclasses import dataclass, field
from io import BytesIO


@dataclass
class Chapter:
    title: str
    level: int
    order: int
    text: str
    href: str = ""


@dataclass
class ParsedBook:
    title: str
    author: str
    chapters: list[Chapter] = field(default_factory=list)


def _extract_text(html_content: bytes | str) -> str:
    """Extract clean text from HTML content."""
    soup = BeautifulSoup(html_content, "lxml")
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    # Normalize whitespace
    return " ".join(text.split())


def _get_item_text(book: epub.EpubBook, href: str) -> str:
    """Get text content for an item by href."""
    # Strip any fragment identifier
    base_href = href.split("#")[0]
    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        item_href = item.get_name()
        if item_href == base_href or item_href.endswith("/" + base_href):
            return _extract_text(item.get_content())
    return ""


def _walk_toc(toc_items, book: epub.EpubBook, chapters: list[Chapter], level: int, order_counter: list[int]):
    """Recursively walk the TOC tree."""
    for item in toc_items:
        if isinstance(item, tuple):
            # Nested section: (Section, [children])
            section, children = item
            href = section.href if hasattr(section, "href") else ""
            text = _get_item_text(book, href) if href else ""
            chapters.append(Chapter(
                title=section.title,
                level=level,
                order=order_counter[0],
                text=text,
                href=href,
            ))
            order_counter[0] += 1
            _walk_toc(children, book, chapters, level + 1, order_counter)
        elif isinstance(item, epub.Link):
            href = item.href
            text = _get_item_text(book, href)
            chapters.append(Chapter(
                title=item.title,
                level=level,
                order=order_counter[0],
                text=text,
                href=href,
            ))
            order_counter[0] += 1


def parse_epub(file_bytes: bytes) -> ParsedBook:
    """Parse an epub file from bytes and return structured book data."""
    book = epub.read_epub(BytesIO(file_bytes), options={"ignore_ncx": False})

    title = book.get_metadata("DC", "title")
    title = title[0][0] if title else "Unknown Title"

    author = book.get_metadata("DC", "creator")
    author = author[0][0] if author else "Unknown Author"

    chapters: list[Chapter] = []
    toc = book.toc

    if toc:
        _walk_toc(toc, book, chapters, 1, [0])

    # Merge text from spine items not covered by any TOC entry into the
    # preceding chapter.  Many EPUBs split content across multiple XHTML
    # files but only reference some of them from the TOC (e.g. supplementary
    # "-sup" files).  Without this, highlights in those files can never match.
    if chapters:
        toc_hrefs: set[str] = set()
        for ch in chapters:
            if ch.href:
                toc_hrefs.add(ch.href.split("#")[0])

        # Build href -> chapter mapping for quick lookup
        href_to_chapter: dict[str, Chapter] = {}
        for ch in chapters:
            if ch.href:
                href_to_chapter[ch.href.split("#")[0]] = ch

        # Walk spine in order; for un-referenced items, append text to the
        # most recent preceding chapter.
        last_chapter: Chapter | None = None
        for item_id, _ in book.spine:
            item = book.get_item_with_id(item_id)
            if item is None:
                continue
            item_href = item.get_name()
            if item_href in href_to_chapter:
                last_chapter = href_to_chapter[item_href]
            elif item_href not in toc_hrefs and last_chapter is not None:
                extra_text = _extract_text(item.get_content())
                if extra_text.strip():
                    last_chapter.text = last_chapter.text + " " + extra_text

    # If TOC produced no chapters, fall back to spine order
    if not chapters:
        for i, item in enumerate(book.get_items_of_type(ebooklib.ITEM_DOCUMENT)):
            text = _extract_text(item.get_content())
            if not text.strip():
                continue
            # Try to get a title from the HTML
            soup = BeautifulSoup(item.get_content(), "lxml")
            heading = soup.find(["h1", "h2", "h3"])
            ch_title = heading.get_text(strip=True) if heading else f"Chapter {i + 1}"
            chapters.append(Chapter(
                title=ch_title,
                level=1,
                order=i,
                text=text,
                href=item.get_name(),
            ))

    return ParsedBook(title=title, author=author, chapters=chapters)
