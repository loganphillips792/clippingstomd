import { ScrollArea, Group, Text, Select, ActionIcon, Tooltip } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import type { Components } from 'react-markdown';
import { IconEdit, IconEye } from '@tabler/icons-react';
import classes from './MarkdownPreview.module.css';

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
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
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
