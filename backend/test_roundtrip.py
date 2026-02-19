"""Verify round-trip and user-content preservation."""

from services.markdown_parser import parse_existing_markdown, RawBlock, ParsedHighlight
from services.markdown_generator import _format_markdown, ChapterResult


def round_trip(md_text):
    parsed = parse_existing_markdown(md_text)
    chapter_results = []
    for ch in parsed.chapters:
        cr = ChapterResult(title=ch.title, level=ch.level)
        for item in ch.content_items:
            if isinstance(item, RawBlock):
                cr.content_items.append({"raw_lines": item.lines})
            elif isinstance(item, ParsedHighlight):
                h_dict = {
                    "text": item.text,
                    "type": item.clip_type,
                    "location": item.location,
                    "page": item.page,
                }
                cr.highlights.append(h_dict)
                cr.content_items.append(h_dict)
        chapter_results.append(cr)
    return _format_markdown(chapter_results, preamble=parsed.preamble)


# Test 1: Round-trip with PAGE metadata (LOCATION/HIGHLIGHT stripped on re-render)
md1_in = """## Chapter One

- "Highlight"
  PAGE 42 · LOCATION 100-105 · HIGHLIGHT
"""
md1_expected = """## Chapter One

- "Highlight"
"""
out1 = round_trip(md1_in)
assert out1 == md1_expected, f"Test 1 FAIL:\n{repr(out1)}\nvs\n{repr(md1_expected)}"
print("Test 1 PASS: Round-trip with PAGE (LOCATION/HIGHLIGHT stripped)")

# Test 2: Round-trip without PAGE (no metadata line at all)
md2_in = """## Chapter One

- "Highlight"
  LOCATION 100-105 · HIGHLIGHT
"""
md2_expected = """## Chapter One

- "Highlight"
"""
out2 = round_trip(md2_in)
assert out2 == md2_expected, f"Test 2 FAIL:\n{repr(out2)}\nvs\n{repr(md2_expected)}"
print("Test 2 PASS: Round-trip without PAGE (metadata line removed)")

# Test 3: Fresh gen path (no content_items)
cr = ChapterResult(title="Ch", level=1)
cr.highlights = [
    {"text": "Hi", "type": "highlight", "location": "PAGE 42 · LOCATION 100-105", "page": 42},
]
out3 = _format_markdown([cr])
assert "PAGE" not in out3, f"Test 3 FAIL: PAGE should not appear in {repr(out3)}"
assert "LOCATION" not in out3, f"Test 3 FAIL: LOCATION should not appear in {repr(out3)}"
assert "HIGHLIGHT" not in out3, f"Test 3 FAIL: HIGHLIGHT should not appear in {repr(out3)}"
print("Test 3 PASS: Fresh gen no metadata")

# Test 4: User content preserved
md4 = """# Title

Preamble text

## Chapter One

- "A highlight"
  LOCATION 100 · HIGHLIGHT

> My personal note

A paragraph.

- Another note
  ANNOTATION

| Col1 | Col2 |
|------|------|
| a    | b    |

## Chapter Two

- "B highlight"
  LOCATION 200 · HIGHLIGHT

```python
code_block = True
```
"""
out4 = round_trip(md4)
assert "> My personal note" in out4, "Blockquote missing"
assert "A paragraph." in out4, "Paragraph missing"
assert "| Col1 | Col2 |" in out4, "Table missing"
assert "```python" in out4, "Code block missing"
assert "Preamble text" in out4, "Preamble missing"
assert "# Title" in out4, "H1 title missing"
assert "ANNOTATION" not in out4, "ANNOTATION should not appear"
assert "LOCATION" not in out4, "LOCATION should not appear"
assert "HIGHLIGHT" not in out4, "HIGHLIGHT label should not appear"
print("Test 4 PASS: User content preserved, metadata cleaned")

# Test 5: Blank-only lines discarded
md5 = """## Chapter

- "A"



- "B"
"""
out5 = round_trip(md5)
assert "\n\n\n" not in out5, f"Test 5 FAIL: extra blanks in {repr(out5)}"
print("Test 5 PASS: Structural blanks not doubled")

print()
print("All tests passed!")
