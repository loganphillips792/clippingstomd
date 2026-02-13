import { useState } from 'react';
import { Container, Title, Text, Button, Group, Card, Stack } from '@mantine/core';
import { type FileWithPath } from '@mantine/dropzone';
import { IconBolt, IconLock } from '@tabler/icons-react';
import { FileDropzone } from '../FileDropzone/FileDropzone';
import { FeatureCards } from '../FeatureCards/FeatureCards';
import classes from './UploadPage.module.css';

interface UploadPageProps {
  onConvert: (epub: File, clippings: File) => void;
  loading: boolean;
}

const EPUB_MIME = ['application/epub+zip'];
const CLIPPINGS_MIME = ['text/plain', 'text/html'];

export function UploadPage({ onConvert, loading }: UploadPageProps) {
  const [epub, setEpub] = useState<File | null>(null);
  const [clippings, setClippings] = useState<File | null>(null);

  const handleEpubDrop = (files: FileWithPath[]) => {
    if (files[0]) setEpub(files[0]);
  };

  const handleClippingsDrop = (files: FileWithPath[]) => {
    if (files[0]) setClippings(files[0]);
  };

  const canConvert = epub && clippings && !loading;

  return (
    <div className={classes.page}>
      <Container size="lg" py={60}>
        <Stack align="center" gap={40}>
          {/* Hero */}
          <div className={classes.hero}>
            <Title order={1} ta="center" className={classes.title}>
              Transform your{' '}
              <Text component="span" inherit c="blue">
                Kindle Highlights
              </Text>
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={560} mt="md">
              Upload your EPUB book and Kindle clippings to get beautifully organized,
              chapter-sorted Markdown notes.
            </Text>
          </div>

          {/* Upload Card */}
          <Card shadow="sm" radius="lg" padding="xl" className={classes.uploadCard}>
            <Group grow align="stretch" gap="lg" wrap="nowrap">
              <FileDropzone
                step={1}
                title="Upload EPUB Book"
                description="Drop your .epub file here"
                helper="Used for chapter structure"
                accept={EPUB_MIME}
                file={epub}
                onDrop={handleEpubDrop}
              />
              <FileDropzone
                step={2}
                title="Upload Kindle Notes"
                description="Drop My Clippings.txt or HTML"
                helper="Your highlights and notes"
                accept={CLIPPINGS_MIME}
                file={clippings}
                onDrop={handleClippingsDrop}
              />
            </Group>
          </Card>

          {/* Convert button */}
          <Button
            size="xl"
            radius="xl"
            leftSection={<IconBolt size={20} />}
            disabled={!canConvert}
            loading={loading}
            onClick={() => epub && clippings && onConvert(epub, clippings)}
            className={classes.convertBtn}
          >
            Convert to Markdown
          </Button>

          {/* Privacy note */}
          <Group gap={6} c="dimmed">
            <IconLock size={14} />
            <Text size="xs">
              Your files are processed locally and never leave your browser.
            </Text>
          </Group>

          {/* Features */}
          <FeatureCards />
        </Stack>
      </Container>

      {/* Footer */}
      <footer className={classes.footer}>
        <Text size="xs" c="dimmed" ta="center">
          &copy; 2026 KindleNotes. Open source and privacy-first.
        </Text>
      </footer>
    </div>
  );
}
