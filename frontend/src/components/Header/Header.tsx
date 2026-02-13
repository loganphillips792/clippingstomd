import { Group, Text, Button, Anchor } from '@mantine/core';
import { IconBookmark, IconDownload, IconCopy } from '@tabler/icons-react';
import classes from './Header.module.css';

interface HeaderProps {
  showResultActions?: boolean;
  onDownload?: () => void;
  onCopy?: () => void;
  onBack?: () => void;
}

export function Header({ showResultActions, onDownload, onCopy, onBack }: HeaderProps) {
  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group
          gap="xs"
          style={{ cursor: onBack ? 'pointer' : 'default' }}
          onClick={onBack}
        >
          <IconBookmark size={28} color="#228be6" />
          <Text fw={700} size="xl">
            KindleNotes
          </Text>
        </Group>

        <Group gap="md">
          {showResultActions ? (
            <>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={onDownload}
              >
                Download .md
              </Button>
              <Button
                variant="outline"
                leftSection={<IconCopy size={16} />}
                onClick={onCopy}
              >
                Copy
              </Button>
            </>
          ) : (
            <>
              <Anchor c="dimmed" size="sm">
                Documentation
              </Anchor>
              <Anchor c="dimmed" size="sm">
                Settings
              </Anchor>
            </>
          )}
        </Group>
      </div>
    </header>
  );
}
