import re
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.epub_parser import parse_epub
from services.clippings_parser import parse_clippings, Clipping
from services.markdown_generator import generate_markdown, merge_markdown

router = APIRouter(prefix="/api")


def _parse_pasted_notes(text: str) -> list[Clipping]:
    """Parse pasted bullet points into Clipping objects."""
    notes: list[Clipping] = []
    for line in text.splitlines():
        line = line.strip()
        # Strip leading bullet markers: -, *, •, numbered (1., 2.)
        line = re.sub(r"^(?:[-*•]\s*|\d+[.)]\s*)", "", line).strip()
        if not line:
            continue
        notes.append(Clipping(
            book_title="",
            author="",
            text=line,
            clip_type="note",
            page=None,
            location_start=None,
            location_end=None,
            date=None,
        ))
    return notes


@router.post("/convert")
async def convert(
    epub: UploadFile = File(...),
    clippings: Optional[UploadFile] = File(None),
    notes: Optional[str] = Form(None),
    existing_markdown: Optional[UploadFile] = File(None),
    existing_markdown_text: Optional[str] = Form(None),
):
    """Convert an epub + Kindle clippings + pasted notes into structured markdown."""
    # Validate epub
    if not epub.filename or not epub.filename.lower().endswith(".epub"):
        raise HTTPException(status_code=400, detail="Please upload a valid .epub file")

    try:
        epub_bytes = await epub.read()
        book = parse_epub(epub_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse epub file: {e}")

    all_clippings: list[Clipping] = []

    # Parse clippings file if provided
    if clippings and clippings.filename:
        try:
            clippings_bytes = await clippings.read()
            clippings_text = clippings_bytes.decode("utf-8", errors="replace")
            all_clippings = parse_clippings(clippings_text, filter_title=book.title)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse clippings file: {e}")

    # Parse pasted notes if provided
    pasted_notes: list[Clipping] = []
    if notes and notes.strip():
        pasted_notes = _parse_pasted_notes(notes)
        all_clippings.extend(pasted_notes)

    if not all_clippings:
        raise HTTPException(
            status_code=400,
            detail="No highlights or notes provided. Upload a clippings file or paste some notes.",
        )

    # Parse existing markdown if provided (merge mode) — file takes precedence over pasted text
    existing_md_text: Optional[str] = None
    if existing_markdown and existing_markdown.filename:
        if not existing_markdown.filename.lower().endswith(".md"):
            raise HTTPException(status_code=400, detail="Existing markdown file must be a .md file")
        try:
            md_bytes = await existing_markdown.read()
            existing_md_text = md_bytes.decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read existing markdown file: {e}")
    elif existing_markdown_text and existing_markdown_text.strip():
        existing_md_text = existing_markdown_text

    if existing_md_text:
        result = merge_markdown(book, all_clippings, existing_md_text)
    else:
        result = generate_markdown(book, all_clippings)

    return {
        "title": result.title,
        "author": result.author,
        "chapters": [
            {
                "title": ch.title,
                "level": ch.level,
                "highlights": ch.highlights,
            }
            for ch in result.chapters
        ],
        "markdown": result.markdown,
        "stats": result.stats,
    }
