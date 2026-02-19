# KindleNotes

Convert your Kindle highlights into structured Markdown organized by book chapters.

Upload an EPUB file and your Kindle `My Clippings.txt` to generate a clean Markdown file with highlights matched to the correct chapters and sections.

## Use Cases

- **Clippings + EPUB** — Upload your Kindle `My Clippings.txt` alongside the EPUB to get all your highlights organized by chapter.
- **Clippings + EPUB + your own notes** — Same as above, plus paste in your own notes (bullet points, thoughts, etc.). Each line gets matched to the closest chapter in the EPUB and woven in with your highlights.
- **Clippings + EPUB + existing Markdown** — Already have a markdown file from a previous export? Toggle merge mode and upload it (or paste it in). New highlights get merged into the existing structure without duplicates.

## Quick Start (Docker)

```bash
docker build -t kindlenotes . && docker run -p 8000:8000 kindlenotes
```

Then open [http://localhost:8000](http://localhost:8000).

## Local Development

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend (separate terminal):**

```bash
cd frontend
npm install
VITE_API_BASE=http://localhost:8000 npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).
