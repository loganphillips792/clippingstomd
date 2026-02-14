import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import { Header } from './components/Header/Header';
import { UploadPage } from './components/UploadPage/UploadPage';
import { ResultsPage } from './components/ResultsPage/ResultsPage';
import { convertFiles } from './api/convert';
import type { ConversionResult } from './types';
import classes from './App.module.css';

export default function App() {
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (epub: File, clippings: File | null, notes?: string, existingMarkdown?: File, existingMarkdownText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await convertFiles(epub, clippings, notes, existingMarkdown, existingMarkdownText);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <MantineProvider>
        <ResultsPage result={result} onBack={handleBack} />
      </MantineProvider>
    );
  }

  return (
    <MantineProvider>
      <div className={classes.app}>
        <Header />
        <UploadPage onConvert={handleConvert} loading={loading} />
        {error && (
          <div className={classes.error}>
            {error}
          </div>
        )}
      </div>
    </MantineProvider>
  );
}
