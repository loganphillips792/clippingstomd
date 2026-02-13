from fastapi import APIRouter, UploadFile, File, HTTPException

from services.epub_parser import parse_epub
from services.clippings_parser import parse_clippings
from services.markdown_generator import generate_markdown

router = APIRouter(prefix="/api")


@router.post("/convert")
async def convert(epub: UploadFile = File(...), clippings: UploadFile = File(...)):
    """Convert an epub + Kindle clippings into structured markdown."""
    # Validate file types
    if not epub.filename or not epub.filename.lower().endswith(".epub"):
        raise HTTPException(status_code=400, detail="Please upload a valid .epub file")

    if not clippings.filename or not clippings.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Please upload a valid .txt clippings file")

    try:
        epub_bytes = await epub.read()
        book = parse_epub(epub_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse epub file: {e}")

    try:
        clippings_bytes = await clippings.read()
        clippings_text = clippings_bytes.decode("utf-8", errors="replace")
        all_clippings = parse_clippings(clippings_text, filter_title=book.title)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse clippings file: {e}")

    if not all_clippings:
        raise HTTPException(
            status_code=400,
            detail=f"No clippings found matching the book title \"{book.title}\". "
                   "Make sure your clippings file contains highlights for this book.",
        )

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
