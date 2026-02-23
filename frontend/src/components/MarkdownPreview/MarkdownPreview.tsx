import { ScrollArea, Group, Text, Select, ActionIcon, Tooltip, Button } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';
import { IconEdit, IconEye, IconPencil, IconTrash, IconX } from '@tabler/icons-react';

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) return extractText((node as { props: { children?: ReactNode } }).props.children);
  return '';
}
/** Recursively strip "DUPLICATE" text nodes from rendered children */
function filterDuplicateText(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    const cleaned = node.replace(/DUPLICATE/g, '').trim();
    return cleaned || null;
  }
  if (Array.isArray(node)) {
    return node.map(filterDuplicateText).filter(Boolean);
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as React.ReactElement<{ children?: ReactNode }>;
    const newChildren = filterDuplicateText(el.props.children);
    // Check if this is a <br> or similar void element
    if (el.props.children === undefined) return el;
    return { ...el, props: { ...el.props, children: newChildren } };
  }
  return node;
}

import classes from './MarkdownPreview.module.css';

// --- Normalization & duplicate detection (mirrors backend logic) ---

/** JS port of backend's _normalize_for_search */
function normalizeForMatch(text: string): string {
  // Collapse whitespace, lowercase
  let t = text.replace(/\s+/g, ' ').trim().toLowerCase();
  // Curly single quotes → ASCII apostrophe
  t = t.replace(/[\u2018\u2019\u201a\u2039\u203a\u02bc]/g, "'");
  // Curly double quotes / guillemets → ASCII double quote
  t = t.replace(/[\u201c\u201d\u201e\u00ab\u00bb]/g, '"');
  // Dash variants → ASCII hyphen
  t = t.replace(/[\u2014\u2013\u2012\u2015]/g, '-');
  // Soft hyphen → remove
  t = t.replace(/\u00ad/g, '');
  // Zero-width / invisible chars
  t = t.replace(/[\u200b-\u200f\u2028-\u202f\u2060\ufeff]/g, '');
  // Remove non-alphanumeric except spaces and apostrophes
  t = t.replace(/[^\w\s']/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

interface HighlightItem {
  text: string;
  normalized: string;
  isDuplicate: boolean;
}

interface DuplicateGroup {
  originalText: string;
  duplicateText: string;
}

/** Parse markdown for highlight items, detecting DUPLICATE markers */
function parseHighlights(md: string): HighlightItem[] {
  const items: HighlightItem[] = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^- (.+)$/);
    if (!match) continue;
    const text = match[1];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const isDuplicate = nextLine.trim() === 'DUPLICATE';
    items.push({ text, normalized: normalizeForMatch(text), isDuplicate });
  }
  return items;
}

/** Find duplicate groups: pairs of (original, duplicate) using bidirectional substring containment */
function findDuplicateGroups(items: HighlightItem[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const nonDuplicates = items.filter(i => !i.isDuplicate);

  for (const dup of items.filter(i => i.isDuplicate)) {
    for (const orig of nonDuplicates) {
      if (orig.normalized === dup.normalized ||
          orig.normalized.includes(dup.normalized) ||
          dup.normalized.includes(orig.normalized)) {
        groups.push({ originalText: orig.text, duplicateText: dup.text });
        break;
      }
    }
  }
  return groups;
}

// --- Removal helpers ---

// Regex matching a duplicate block: bullet line + "  DUPLICATE" line + optional blank line
const DUPLICATE_BLOCK_RE = /^- .+\n {2}DUPLICATE\n?\n?/gm;

function countDuplicates(markdown: string): number {
  return (markdown.match(DUPLICATE_BLOCK_RE) || []).length;
}

function removeAllDuplicates(markdown: string): string {
  return markdown.replace(DUPLICATE_BLOCK_RE, '').replace(/\n{3,}/g, '\n\n');
}

/** Remove a DUPLICATE-marked entry by its literal text */
function removeDuplicateEntry(markdown: string, itemText: string): string {
  // Find "- {text}\n  DUPLICATE\n" and remove it
  const target = `- ${itemText}\n  DUPLICATE\n`;
  let result = markdown.replace(target, '');
  // Also try without trailing newline (end of file)
  if (result === markdown) {
    result = markdown.replace(`- ${itemText}\n  DUPLICATE`, '');
  }
  return result.replace(/\n{3,}/g, '\n\n');
}

/** Remove an original entry: remove its line AND strip the DUPLICATE marker from its paired duplicate */
function removeOriginalEntry(markdown: string, originalText: string, pairedDuplicateText: string): string {
  // Remove the original's "- {text}\n" line
  let result = markdown.replace(`- ${originalText}\n`, '');
  // Strip the DUPLICATE marker from the paired duplicate so it becomes a normal entry
  result = result.replace(`- ${pairedDuplicateText}\n  DUPLICATE`, `- ${pairedDuplicateText}`);
  return result.replace(/\n{3,}/g, '\n\n');
}

interface MarkdownPreviewProps {
  markdown: string;
  activeChapterTitle?: string;
  onEdit?: (markdown: string) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export function MarkdownPreview({ markdown, activeChapterTitle, onEdit }: MarkdownPreviewProps) {
  const [theme, setTheme] = useState<string>('light');
  const [editing, setEditing] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollToLineRef = useRef<number | null>(null);

  // Precompute character offsets for every bullet line: raw text after "- " → char offset
  const bulletOffsetMap = useMemo(() => {
    const map = new Map<string, number>();
    let pos = 0;
    for (const line of markdown.split('\n')) {
      if (line.startsWith('- ')) {
        const key = line.slice(2).trim();
        if (!map.has(key)) map.set(key, pos);
      }
      pos += line.length + 1;
    }
    return map;
  }, [markdown]);

  const handleEditAtLine = (itemText: string) => {
    scrollToLineRef.current = bulletOffsetMap.get(itemText.trim()) ?? null;
    setEditing(true);
  };

  const dupCount = useMemo(() => countDuplicates(markdown), [markdown]);

  // Pre-compute duplicate groups and originals set for rendering
  const groupsByOriginal = useMemo(() => {
    const items = parseHighlights(markdown);
    const groups = findDuplicateGroups(items);
    const byOrig = new Map<string, DuplicateGroup>();
    for (const g of groups) {
      byOrig.set(normalizeForMatch(g.originalText), g);
    }
    return byOrig;
  }, [markdown]);

  const editBtn = (itemText: string) => (
    <Tooltip label="Edit line" position="left">
      <ActionIcon
        className={classes.editBtn}
        variant="subtle"
        color="gray"
        size="xs"
        onClick={() => handleEditAtLine(itemText)}
      >
        <IconPencil size={12} />
      </ActionIcon>
    </Tooltip>
  );

  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children);
      return <h1 id={`heading-${slugify(text)}`} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const text = String(children);
      return <h2 id={`heading-${slugify(text)}`} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      return <h3 id={`heading-${slugify(text)}`} {...props}>{children}</h3>;
    },
    li: ({ children, ...props }) => {
      const text = extractText(children);
      const normalized = normalizeForMatch(text);

      // Case 1: DUPLICATE-marked item
      if (text.includes('DUPLICATE')) {
        const filteredChildren = filterDuplicateText(children);
        const cleanText = text.replace(/\s*DUPLICATE\s*/, '').trim();
        return (
          <li className={classes.duplicateHighlight} {...props}>
            <span className={classes.duplicateContent}>{filteredChildren}</span>
            {editBtn(cleanText)}
            <Tooltip label="Remove duplicate" position="left">
              <ActionIcon
                className={classes.removeBtn}
                variant="subtle"
                color="orange"
                size="xs"
                onClick={() => onEdit?.(removeDuplicateEntry(markdown, cleanText))}
              >
                <IconX size={12} />
              </ActionIcon>
            </Tooltip>
          </li>
        );
      }

      // Case 2: Original that has a paired duplicate
      const group = groupsByOriginal.get(normalized);
      if (group) {
        return (
          <li className={classes.duplicateHighlight} {...props}>
            <span className={classes.duplicateContent}>{children}</span>
            {editBtn(group.originalText)}
            <Tooltip label="Remove original" position="left">
              <ActionIcon
                className={classes.removeBtn}
                variant="subtle"
                color="orange"
                size="xs"
                onClick={() => onEdit?.(removeOriginalEntry(markdown, group.originalText, group.duplicateText))}
              >
                <IconX size={12} />
              </ActionIcon>
            </Tooltip>
          </li>
        );
      }

      // Case 3: Normal item
      return (
        <li className={classes.editableLi} {...props}>
          <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
          {editBtn(text)}
        </li>
      );
    },
  };

  useEffect(() => {
    if (!activeChapterTitle || !viewportRef.current || editing) return;

    const slug = slugify(activeChapterTitle);
    const target = viewportRef.current.querySelector(`#heading-${CSS.escape(slug)}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeChapterTitle, editing]);

  useEffect(() => {
    if (!editing || !textareaRef.current) return;
    const textarea = textareaRef.current;
    // Use setTimeout to ensure the textarea is fully laid out and has dimensions
    const timer = setTimeout(() => {
      const offset = scrollToLineRef.current;
      scrollToLineRef.current = null;
      textarea.focus();
      if (offset !== null && offset > 0) {
        textarea.setSelectionRange(offset, offset);
        // Scroll proportionally: cursor position in text → same ratio in scroll
        const ratio = offset / textarea.value.length;
        textarea.scrollTop = ratio * textarea.scrollHeight - textarea.clientHeight / 3;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [editing]);

  return (
    <div className={`${classes.preview} ${theme === 'dark' ? classes.dark : ''}`}>
      <Group justify="space-between" px="md" py="sm" className={classes.toolbar}>
        <Group gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
            {editing ? 'Edit Markdown' : 'Markdown Preview'}
          </Text>
        </Group>
        <Group gap="xs">
          {dupCount > 0 && (
            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconTrash size={14} />}
              onClick={() => onEdit?.(removeAllDuplicates(markdown))}
            >
              Remove {dupCount} Duplicate{dupCount > 1 ? 's' : ''}
            </Button>
          )}
          <Tooltip label={editing ? 'Preview' : 'Edit'} position="bottom">
            <ActionIcon
              variant={editing ? 'filled' : 'subtle'}
              color={editing ? 'blue' : 'gray'}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <IconEye size={14} /> : <IconEdit size={14} />}
            </ActionIcon>
          </Tooltip>
          <Select
            size="xs"
            value={theme}
            onChange={(v) => setTheme(v || 'light')}
            data={[
              { value: 'light', label: 'GitHub Light' },
              { value: 'dark', label: 'GitHub Dark' },
            ]}
            w={140}
            styles={{ input: { fontSize: 12 } }}
          />
        </Group>
      </Group>

      {editing ? (
        <textarea
          ref={textareaRef}
          className={`${classes.editor} ${theme === 'dark' ? classes.editorDark : ''}`}
          value={markdown}
          onChange={(e) => onEdit?.(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <ScrollArea style={{ flex: 1 }} offsetScrollbars px="md" pb="md" viewportRef={viewportRef}>
          <div className={classes.content}>
            <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
