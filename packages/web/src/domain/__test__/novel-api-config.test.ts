import { describe, expect, it } from 'vitest';
import { createDefaultNovelApiSettings, normalizeNovelApiProvider } from '../novel-api-config';

describe('novel api defaults', () => {
  it('uses AI novel recognition as the default source and keeps Open Library as a configurable adapter', () => {
    const settings = createDefaultNovelApiSettings();

    expect(settings.novelApiProvider).toBe('ai');
    expect(settings.novelApiBaseURL).toBe('https://openlibrary.org');
    expect(settings.novelApiBuildRequestCode).toContain('/search.json');
    expect(settings.novelApiMapResponseCode).toContain('Open Library');
  });

  it('normalizes legacy provider names while keeping explicit disabled state', () => {
    expect(normalizeNovelApiProvider('biquge-compatible')).toBe('compatible');
    expect(normalizeNovelApiProvider('custom')).toBe('compatible');
    expect(normalizeNovelApiProvider('ai')).toBe('ai');
    expect(normalizeNovelApiProvider('disabled')).toBe('disabled');
    expect(normalizeNovelApiProvider(undefined)).toBe('ai');
  });
});
