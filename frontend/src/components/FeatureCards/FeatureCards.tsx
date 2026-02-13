import { SimpleGrid, Card, Text, ThemeIcon } from '@mantine/core';
import { IconListTree, IconMarkdown, IconShieldLock } from '@tabler/icons-react';
import classes from './FeatureCards.module.css';

const features = [
  {
    icon: IconListTree,
    title: 'Chapter Recognition',
    description:
      'Automatically matches your highlights to the correct book chapters using smart text matching.',
  },
  {
    icon: IconMarkdown,
    title: 'Markdown Ready',
    description:
      'Export your organized highlights as clean Markdown, ready for Obsidian, Notion, or any notes app.',
  },
  {
    icon: IconShieldLock,
    title: '100% Private',
    description:
      'All processing happens on your machine. Your books and highlights never leave your computer.',
  },
];

export function FeatureCards() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" className={classes.grid}>
      {features.map((feature) => (
        <Card key={feature.title} shadow="sm" radius="md" padding="xl" className={classes.card}>
          <ThemeIcon size={48} radius="md" variant="light" mb="md">
            <feature.icon size={24} />
          </ThemeIcon>
          <Text fw={600} size="lg" mb={4}>
            {feature.title}
          </Text>
          <Text size="sm" c="dimmed" lh={1.6}>
            {feature.description}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
