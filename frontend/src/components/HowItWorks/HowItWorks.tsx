import { SimpleGrid, Text, ThemeIcon, Stack } from '@mantine/core';
import { IconFileUpload, IconTransform, IconDownload } from '@tabler/icons-react';
import classes from './HowItWorks.module.css';

const steps = [
  {
    icon: IconFileUpload,
    title: '1. Upload',
    description:
      'Select your EPUB file for structure and your Kindle clippings for your notes.',
  },
  {
    icon: IconTransform,
    title: '2. Process',
    description:
      'Our tool maps your highlights to the correct book headings automatically.',
  },
  {
    icon: IconDownload,
    title: '3. Export',
    description:
      'Download a clean, structured Markdown file ready for your second brain.',
  },
];

export function HowItWorks() {
  return (
    <div className={classes.section}>
      <Stack align="center" gap={4} mb="xl">
        <Text fw={700} size="xl">
          How it Works
        </Text>
        <div className={classes.underline} />
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" className={classes.grid}>
        {steps.map((step) => (
          <Stack key={step.title} align="center" gap="sm" className={classes.step}>
            <ThemeIcon size={56} radius="xl" variant="light" color="blue">
              <step.icon size={26} />
            </ThemeIcon>
            <Text fw={600} size="md">
              {step.title}
            </Text>
            <Text size="sm" c="dimmed" ta="center" lh={1.6} maw={240}>
              {step.description}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>
    </div>
  );
}
