import type { ConversionResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function convertFiles(
  epub: File,
  clippings: File | null,
  notes?: string,
  existingMarkdown?: File,
  existingMarkdownText?: string,
  onProgress?: (pct: number) => void
): Promise<ConversionResult> {
  const formData = new FormData();
  formData.append('epub', epub);
  if (clippings) {
    formData.append('clippings', clippings);
  }
  if (notes?.trim()) {
    formData.append('notes', notes);
  }
  if (existingMarkdown) {
    formData.append('existing_markdown', existingMarkdown);
  }
  if (existingMarkdownText?.trim()) {
    formData.append('existing_markdown_text', existingMarkdownText);
  }

  onProgress?.(10);

  const response = await fetch(`${API_BASE}/api/convert`, {
    method: 'POST',
    body: formData,
  });

  onProgress?.(80);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Conversion failed' }));
    throw new Error(error.detail || 'Conversion failed');
  }

  const data: ConversionResult = await response.json();
  onProgress?.(100);
  return data;
}
