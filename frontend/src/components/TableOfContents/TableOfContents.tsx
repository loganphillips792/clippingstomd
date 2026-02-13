import { Text, Badge, Stack, UnstyledButton, Group, ScrollArea } from '@mantine/core';
import type { Chapter } from '../../types';
import classes from './TableOfContents.module.css';

interface TableOfContentsProps {
  chapters: Chapter[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function TableOfContents({ chapters, activeIndex, onSelect }: TableOfContentsProps) {
  return (
    <div className={classes.sidebar}>
      <Group justify="space-between" mb="sm" px="md" pt="md">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
          Table of Contents
        </Text>
        <Badge size="sm" variant="light">
          {chapters.length}
        </Badge>
      </Group>

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        <Stack gap={0}>
          {chapters.map((chapter, i) => (
            <UnstyledButton
              key={i}
              className={`${classes.item} ${i === activeIndex ? classes.active : ''}`}
              onClick={() => onSelect(i)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" lineClamp={1} className={classes.chapterTitle}>
                  {chapter.title}
                </Text>
                {chapter.highlights.length > 0 && (
                  <Badge size="xs" variant="light" className={classes.badge}>
                    {chapter.highlights.length}
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      </ScrollArea>
    </div>
  );
}
