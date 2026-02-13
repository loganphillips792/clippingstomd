import { useState } from 'react';
import { Group, Text, Badge, Progress } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { ConversionResult } from '../../types';
import { Header } from '../Header/Header';
import { TableOfContents } from '../TableOfContents/TableOfContents';
import { MarkdownPreview } from '../MarkdownPreview/MarkdownPreview';
import { StatusBar } from '../StatusBar/StatusBar';
import classes from './ResultsPage.module.css';

interface ResultsPageProps {
  result: ConversionResult;
  onBack: () => void;
}

export function ResultsPage({ result, onBack }: ResultsPageProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [markdown, setMarkdown] = useState(result.markdown);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title || 'highlights'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
  };

  return (
    <div className={classes.page}>
      <Header
        showResultActions
        onDownload={handleDownload}
        onCopy={handleCopy}
        onBack={onBack}
      />

      {/* File info bar */}
      <div className={classes.infoBar}>
        <Group justify="space-between" align="center" px="md" wrap="nowrap">
          <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} lineClamp={1}>
              {result.title}
            </Text>
            <Progress
              value={result.stats.match_rate}
              size="sm"
              style={{ flex: 1, maxWidth: 200 }}
              radius="xl"
            />
            <Text size="xs" fw={600} c="blue">
              {result.stats.match_rate}%
            </Text>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <Badge
              size="sm"
              variant="light"
              color="green"
              leftSection={<IconCheck size={10} />}
            >
              EPUB Parsed
            </Badge>
            <Badge
              size="sm"
              variant="light"
              color="green"
              leftSection={<IconCheck size={10} />}
            >
              {result.stats.total_highlights} Highlights Found
            </Badge>
            <Badge size="sm" variant="light" color="blue">
              {result.stats.matched_highlights} Matched
            </Badge>
          </Group>
        </Group>
      </div>

      {/* Main panels */}
      <div className={classes.panels}>
        <div className={classes.tocPanel}>
          <TableOfContents
            chapters={result.chapters}
            activeIndex={activeChapter}
            onSelect={setActiveChapter}
          />
        </div>
        <div className={classes.previewPanel}>
          <MarkdownPreview
            markdown={markdown}
            activeChapterTitle={result.chapters[activeChapter]?.title}
            onEdit={setMarkdown}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        fileSize={result.stats.file_size}
        matchRate={result.stats.match_rate}
        orphanCount={result.stats.orphaned_highlights}
      />
    </div>
  );
}
