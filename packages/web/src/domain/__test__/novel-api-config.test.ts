import { describe, expect, it } from 'vitest';
import { createDefaultNovelApiSettings, normalizeNovelApiProvider } from '../novel-api-config';

describe('novel api defaults', () => {
  it('uses Open Library as the default external novel API adapter', () => {
    const settings = createDefaultNovelApiSettings();

    expect(settings.novelApiProvider).toBe('custom-functions');
    expect(settings.novelApiBaseURL).toBe('https://openlibrary.org');
    expect(settings.novelApiBuildRequestCode).toContain('/search.json');
    expect(settings.novelApiMapResponseCode).toContain('Open Library');
  });

  it('normalizes legacy provider names while keeping explicit disabled state', () => {
    expect(normalizeNovelApiProvider('biquge-compatible')).toBe('compatible');
    expect(normalizeNovelApiProvider('custom')).toBe('compatible');
    expect(normalizeNovelApiProvider('disabled')).toBe('disabled');
    expect(normalizeNovelApiProvider(undefined)).toBe('custom-functions');
  });
});
