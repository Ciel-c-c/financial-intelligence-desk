import { validateDatasetEnvelope } from './site-contract.mjs';

const EDITIONS = ['morning', 'close'];
const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());

export function buildDailyBrief({ edition, generatedAt, snapshots = {}, facts = [], focus, watchItems = [], invalidationConditions = [] }) {
  if (!EDITIONS.includes(edition)) throw new Error(`unsupported brief edition: ${edition}`);
  if (!isIso(generatedAt)) throw new Error('valid generatedAt is required');
  if (focus && (!Array.isArray(focus.evidenceIds) || focus.evidenceIds.length === 0)) throw new Error('brief focus requires evidence');
  const entries = Object.entries(snapshots).filter(([, snapshot]) => snapshot?.version);
  const snapshotVersions = Object.fromEntries(entries.map(([id, snapshot]) => [id, snapshot.version]));
  const dates = entries.map(([, snapshot]) => snapshot.dataAsOf).filter(isIso).sort();
  const hasFacts = facts.length > 0;
  return {
    schemaVersion: 1,
    attemptedAt: generatedAt,
    lastSuccessfulAt: hasFacts ? generatedAt : null,
    dataAsOf: dates.length ? new Date(dates.at(-1)).toISOString() : null,
    nextExpectedAt: new Date(new Date(generatedAt).valueOf() + 12 * 60 * 60 * 1_000).toISOString(),
    status: hasFacts ? 'fresh' : 'unavailable',
    freshness: hasFacts ? 'delayed' : 'historical',
    sourceHealth: [],
    ...(hasFacts ? {} : { fallbackReason: '没有足够的新事实生成简报' }),
    edition,
    generatedAt,
    snapshotVersions,
    facts,
    ...(focus ? { marketFocus: focus } : {}),
    watchItems,
    invalidationConditions,
  };
}

export function validateDailyBrief(value) {
  return validateDatasetEnvelope(value) && EDITIONS.includes(value.edition) && isIso(value.generatedAt)
    && value.snapshotVersions && typeof value.snapshotVersions === 'object'
    && Array.isArray(value.facts) && value.facts.every(item => typeof item === 'string')
    && Array.isArray(value.watchItems) && value.watchItems.every(item => typeof item === 'string')
    && Array.isArray(value.invalidationConditions) && value.invalidationConditions.every(item => typeof item === 'string')
    && (value.marketFocus === undefined || typeof value.marketFocus.text === 'string' && Array.isArray(value.marketFocus.evidenceIds) && value.marketFocus.evidenceIds.length > 0);
}
