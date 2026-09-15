import { describe, expect, it } from 'vitest';
import { newsSources, validateRegisteredSource } from '../../scripts/news/source-registry.mjs';

describe('verified news source registry', () => {
  it('contains unique, current, official sources across required regions', () => {
    expect(new Set(newsSources.map(source => source.id)).size).toBe(newsSources.length);
    expect(newsSources.every(source => validateRegisteredSource(source, '2026-09-15T00:00:00Z'))).toBe(true);
    for (const region of ['中国', '美国', '欧洲', '全球']) expect(newsSources.some(source => source.regions.includes(region))).toBe(true);
  });
  it('rejects unsafe, stale, and mismatched source definitions', () => {
    expect(validateRegisteredSource({ ...newsSources[0], feedUrl:'https://evil.test/rss' }, '2026-09-14T00:00:00Z')).toBe(false);
    expect(validateRegisteredSource({ ...newsSources[0], feedUrl: 'http://example.com/feed' }, '2026-09-14T00:00:00Z')).toBe(false);
    expect(validateRegisteredSource({ ...newsSources[0], verifiedAt: '2025-01-01' }, '2026-09-14T00:00:00Z')).toBe(false);
  });
});
