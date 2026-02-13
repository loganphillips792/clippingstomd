import { ScrollArea, Group, Text, Select } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import classes from './MarkdownPreview.module.css';

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [theme, setTheme] = useState<string>('light');

  return (
    <div className={`${classes.preview} ${theme === 'dark' ? classes.dark : ''}`}>
      <Group justify="space-between" px="md" py="sm" className={classes.toolbar}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
          Markdown Preview
        </Text>
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

      <ScrollArea style={{ flex: 1 }} offsetScrollbars px="md" pb="md">
        <div className={classes.content}>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}
