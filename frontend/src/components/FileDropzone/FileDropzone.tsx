import { Text, Group, Stack } from '@mantine/core';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconBook, IconFileText, IconX } from '@tabler/icons-react';
import classes from './FileDropzone.module.css';

interface FileDropzoneProps {
  step: number;
  title: string;
  description: string;
  helper: string;
  accept: string[];
  file: File | null;
  onDrop: (files: FileWithPath[]) => void;
}

export function FileDropzone({
  step,
  title,
  description,
  helper,
  accept,
  file,
  onDrop,
}: FileDropzoneProps) {
  const Icon = step === 1 ? IconBook : IconFileText;

  return (
    <div className={classes.wrapper}>
      <Text size="sm" c="dimmed" mb={8}>
        Step {step}
      </Text>
      <Dropzone
        onDrop={onDrop}
        accept={accept}
        maxFiles={1}
        className={classes.dropzone}
      >
        <Stack align="center" gap="sm" style={{ pointerEvents: 'none' }} py="xl">
          <Dropzone.Accept>
            <IconUpload size={48} color="#228be6" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={48} color="red" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <Icon size={48} color="#868e96" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="lg" fw={600} ta="center">
              {title}
            </Text>
            <Text size="sm" c="dimmed" ta="center" mt={4}>
              {file ? (
                <Group gap={4} justify="center">
                  <IconFileText size={14} />
                  {file.name}
                </Group>
              ) : (
                description
              )}
            </Text>
          </div>
          <Text size="xs" c="dimmed">
            {helper}
          </Text>
        </Stack>
      </Dropzone>
    </div>
  );
}
