# KindleNotes

Convert your Kindle highlights into structured Markdown organized by book chapters.

Upload an EPUB file and your Kindle `My Clippings.txt` to generate a clean Markdown file with highlights matched to the correct chapters and sections.

## Quick Start (Docker)

```bash
docker build -t kindlenotes .
docker run -p 8000:8000 kindlenotes
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
