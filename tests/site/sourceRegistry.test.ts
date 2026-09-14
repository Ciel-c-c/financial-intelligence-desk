import { describe, expect, it } from 'vitest';
import {
  assertSourceReviewCurrent,
  getEnabledMarketSources,
  marketSources,
} from '../../scripts/site/source-registry.mjs';

const source = {
  id: 'official-test',
  name: 'Official Test',
  owner: 'Official Test',
  baseUrl: 'https://data.example.gov',
  allowedHosts: ['data.example.gov'],
  kind: 'official',
  markets: ['globalAssets'],
  reviewedAt: '2026-09-01T00:00:00Z',
  reviewExpiresAt: '2026-11-30T00:00:00Z',
  termsUrl: 'https://data.example.gov/terms',
  enabled: true,
};

describe('market source registry', () => {
  it('rejects expired reviews', () => {
    expect(() => assertSourceReviewCurrent({ ...source, reviewExpiresAt: '2026-09-01T00:00:00Z' }, new Date('2026-09-14T00:00:00Z'))).toThrow(/review expired/);
  });

  it('rejects source URLs outside the explicit host allowlist', () => {
    expect(() => assertSourceReviewCurrent({ ...source, baseUrl: 'https://lookalike.example.com' }, new Date('2026-09-14T00:00:00Z'))).toThrow(/domain mismatch/);
  });

  it('returns only enabled and currently reviewed sources', () => {
    const enabled = getEnabledMarketSources(new Date('2026-09-14T00:00:00Z'));
    expect(enabled.length).toBeGreaterThan(0);
    expect(enabled.every((item: { enabled: boolean }) => item.enabled)).toBe(true);
    expect(marketSources.some((item: { enabled: boolean }) => !item.enabled)).toBe(true);
  });
});
