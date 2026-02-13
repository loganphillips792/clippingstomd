export interface Highlight {
  text: string;
  location: string;
  type: 'highlight' | 'note';
  note?: string;
}

export interface Chapter {
  title: string;
  highlights: Highlight[];
}

export interface ConversionResult {
  title: string;
  author: string;
  chapters: Chapter[];
  markdown: string;
  stats: {
    total_highlights: number;
    matched_highlights: number;
    orphaned_highlights: number;
    match_rate: number;
    file_size: string;
  };
}
