import { describe, expect, it } from 'vitest';
import {
  buildSiteSnapshot,
  deriveDatasetStatus,
  validateDatasetEnvelope,
  validateSiteSnapshot,
} from '../../scripts/site/site-contract.mjs';

const envelope = {
  schemaVersion: 1,
  attemptedAt: '2026-09-14T02:00:00Z',
  lastSuccessfulAt: '2026-09-14T01:00:00Z',
  dataAsOf: '2026-09-14T00:00:00Z',
  nextExpectedAt: '2026-09-14T03:00:00Z',
  status: 'delayed',
  freshness: 'delayed',
  sourceHealth: [],
  fallbackReason: 'source timeout',
} as const;

describe('site snapshot contract', () => {
  it('keeps attempt, success and underlying data timestamps separate', () => {
    expect(validateDatasetEnvelope(envelope)).toBe(true);
    expect(validateDatasetEnvelope({ ...envelope, dataAsOf: envelope.attemptedAt, nextExpectedAt: 'invalid' })).toBe(false);
  });

  it('marks a dataset that has never succeeded as unavailable', () => {
    expect(deriveDatasetStatus({
      attemptedAt: '2026-09-14T02:00:00Z',
      lastSuccessfulAt: null,
      dataAsOf: null,
      expectedIntervalMs: 3_600_000,
      available: false,
    })).toBe('unavailable');
  });

  it('marks partially available current data as partial', () => {
    expect(deriveDatasetStatus({
      attemptedAt: '2026-09-14T02:00:00Z',
      lastSuccessfulAt: '2026-09-14T02:00:00Z',
      dataAsOf: '2026-09-14T01:55:00Z',
      expectedIntervalMs: 3_600_000,
      available: true,
      partial: true,
    })).toBe('partial');
  });

  it('builds a status-only index without copying business data', () => {
    const value = buildSiteSnapshot({
      attemptedAt: '2026-09-14T02:00:00Z',
      datasets: [{
        id: 'market-overview',
        ...envelope,
        instruments: [{ id: 'should-not-leak' }],
      }],
    });

    expect(validateSiteSnapshot(value)).toBe(true);
    expect(value.datasets[0]).not.toHaveProperty('instruments');
    expect(value.datasets[0]).toEqual({
      id: 'market-overview',
      status: 'delayed',
      freshness: 'delayed',
      lastSuccessfulAt: envelope.lastSuccessfulAt,
      dataAsOf: envelope.dataAsOf,
      nextExpectedAt: envelope.nextExpectedAt,
      fallbackReason: envelope.fallbackReason,
    });
  });
});
