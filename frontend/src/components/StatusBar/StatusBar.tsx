import { Group, Text } from '@mantine/core';
import classes from './StatusBar.module.css';

interface StatusBarProps {
  fileSize: string;
  matchRate: number;
  orphanCount: number;
  isMerge?: boolean;
  newAdded?: number;
  duplicatesSkipped?: number;
}

export function StatusBar({ fileSize, matchRate, orphanCount, isMerge, newAdded, duplicatesSkipped }: StatusBarProps) {
  return (
    <div className={classes.bar}>
      <Group justify="center" gap="xl">
        <Group gap={6}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Total Size
          </Text>
          <Text size="xs" fw={700}>
            {fileSize}
          </Text>
        </Group>

        <div className={classes.divider} />

        <Group gap={6}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Match Rate
          </Text>
          <Text size="xs" fw={700} c={matchRate > 80 ? 'green' : matchRate > 50 ? 'yellow' : 'red'}>
            {matchRate}%
          </Text>
        </Group>

        <div className={classes.divider} />

        <Group gap={6}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Orphaned
          </Text>
          <Text size="xs" fw={700} c={orphanCount === 0 ? 'green' : 'orange'}>
            {orphanCount}
          </Text>
        </Group>

        {isMerge && (
          <>
            <div className={classes.divider} />

            <Group gap={6}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                New Added
              </Text>
              <Text size="xs" fw={700} c="teal">
                {newAdded}
              </Text>
            </Group>

            <div className={classes.divider} />

            <Group gap={6}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Duplicates Skipped
              </Text>
              <Text size="xs" fw={700} c="gray">
                {duplicatesSkipped}
              </Text>
            </Group>
          </>
        )}
      </Group>
    </div>
  );
}
