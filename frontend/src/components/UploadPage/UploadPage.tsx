import { useState } from 'react';
import { Container, Title, Text, Button, Group, Card, Stack, Textarea, Collapse, UnstyledButton, Switch } from '@mantine/core';
import { type FileWithPath } from '@mantine/dropzone';
import { IconBolt, IconLock, IconGitMerge, IconChevronDown, IconChevronRight, IconNotes } from '@tabler/icons-react';
import { FileDropzone } from '../FileDropzone/FileDropzone';
import { HowItWorks } from '../HowItWorks/HowItWorks';
import { FeatureCards } from '../FeatureCards/FeatureCards';
import classes from './UploadPage.module.css';

const MARKDOWN_MIME = ['text/markdown', 'text/plain'];

interface UploadPageProps {
  onConvert: (epub: File, clippings: File | null, notes?: string, existingMarkdown?: File, existingMarkdownText?: string) => void;
  loading: boolean;
}

const EPUB_MIME = ['application/epub+zip'];
const CLIPPINGS_MIME = ['text/plain', 'text/html'];

export function UploadPage({ onConvert, loading }: UploadPageProps) {
  const [epub, setEpub] = useState<File | null>(null);
  const [clippings, setClippings] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [existingMd, setExistingMd] = useState<File | null>(null);
  const [existingMdText, setExistingMdText] = useState('');

  const handleEpubDrop = (files: FileWithPath[]) => {
    if (files[0]) setEpub(files[0]);
  };

  const handleClippingsDrop = (files: FileWithPath[]) => {
    if (files[0]) setClippings(files[0]);
  };

  const handleExistingMdDrop = (files: FileWithPath[]) => {
    if (files[0]) setExistingMd(files[0]);
  };

  const handleMergeModeToggle = (checked: boolean) => {
    setMergeMode(checked);
    if (!checked) {
      setExistingMd(null);
      setExistingMdText('');
    }
  };

  const hasInput = clippings || notes.trim();
  const hasMergeInput = existingMd || existingMdText.trim();
  const canConvert = epub && hasInput && !loading && (!mergeMode || hasMergeInput);

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

            {/* Paste Notes Section */}
            <div className={classes.notesSection}>
              <UnstyledButton
                onClick={() => setNotesOpen((o) => !o)}
                className={classes.notesToggle}
              >
                <Group gap={6}>
                  {notesOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  <Text size="sm" c="dimmed" fw={500}>
                    Step 3
                  </Text>
                  <IconNotes size={16} />
                  <Text size="sm" fw={500}>
                    Paste additional notes
                  </Text>
                  {notes.trim() && !notesOpen && (
                    <Text size="xs" c="blue" fw={500}>
                      ({notes.trim().split('\n').filter(Boolean).length} lines)
                    </Text>
                  )}
                </Group>
              </UnstyledButton>
              <Collapse in={notesOpen}>
                <Stack gap="xs" mt="sm">
                  <Textarea
                    placeholder={"Paste your bullet points here, one per line:\n- First note or highlight\n- Second note or highlight"}
                    minRows={5}
                    maxRows={12}
                    autosize
                    value={notes}
                    onChange={(e) => setNotes(e.currentTarget.value)}
                    styles={{
                      input: { fontFamily: 'monospace', fontSize: 13 },
                    }}
                  />
                  <Text size="xs" c="dimmed">
                    Each line will be matched to the closest chapter in the EPUB.
                  </Text>
                </Stack>
              </Collapse>
            </div>

            {/* Merge Mode Section */}
            <div className={classes.mergeSection}>
              <Group gap="sm">
                <IconGitMerge size={16} color="#495057" />
                <Switch
                  label="I have an existing markdown file"
                  checked={mergeMode}
                  onChange={(e) => handleMergeModeToggle(e.currentTarget.checked)}
                  size="sm"
                />
              </Group>
              <Collapse in={mergeMode}>
                <Stack gap="sm" mt={12}>
                  <FileDropzone
                    step={4}
                    title="Upload Existing Markdown"
                    description="Drop your previously exported .md file"
                    helper="New highlights will be merged in"
                    accept={MARKDOWN_MIME}
                    file={existingMd}
                    onDrop={handleExistingMdDrop}
                  />
                  <Text size="xs" c="dimmed" ta="center">
                    or paste your markdown below
                  </Text>
                  <Textarea
                    placeholder={"Paste your existing markdown here..."}
                    minRows={5}
                    maxRows={12}
                    autosize
                    value={existingMdText}
                    onChange={(e) => setExistingMdText(e.currentTarget.value)}
                    disabled={!!existingMd}
                    styles={{
                      input: { fontFamily: 'monospace', fontSize: 13 },
                    }}
                  />
                  {existingMd && (
                    <Text size="xs" c="dimmed">
                      File uploaded — paste field is disabled. Remove the file to paste instead.
                    </Text>
                  )}
                </Stack>
              </Collapse>
            </div>
          </Card>

          {/* Convert button */}
          <Button
            size="xl"
            radius="xl"
            leftSection={<IconBolt size={20} />}
            disabled={!canConvert}
            loading={loading}
            onClick={() => epub && onConvert(epub, clippings, notes || undefined, existingMd || undefined, existingMdText || undefined)}
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

          {/* How it Works */}
          <HowItWorks />

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
