import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ActionIcon, Group, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import classes from './DiffView.module.css';

interface DiffViewProps {
  originalMarkdown: string;
  mergedMarkdown: string;
  onBack: () => void;
}

export function DiffView({ originalMarkdown, mergedMarkdown, onBack }: DiffViewProps) {
  return (
    <div className={classes.wrapper}>
      <div className={classes.toolbar}>
        <Group gap="sm">
          <ActionIcon variant="subtle" color="gray" onClick={onBack} size="sm">
            <IconArrowLeft size={14} />
          </ActionIcon>
          <Text size="xs" fw={600} c="dimmed">Original</Text>
          <Text size="xs" c="dimmed">vs</Text>
          <Text size="xs" fw={600} c="dimmed">Merged</Text>
        </Group>
      </div>
      <div className={classes.diffContainer}>
        <ReactDiffViewer
          oldValue={originalMarkdown}
          newValue={mergedMarkdown}
          splitView
          compareMethod={DiffMethod.WORDS}
          leftTitle="Original"
          rightTitle="Merged"
        />
      </div>
    </div>
  );
}
