export const DATASET_STATUSES = ['fresh', 'partial', 'delayed', 'unavailable'];
export const FRESHNESS_VALUES = ['realtime', 'delayed', 'close', 'historical'];

const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());
const isNullableIso = value => value === null || isIso(value);

export function validateDatasetEnvelope(value) {
  return value?.schemaVersion === 1
    && isIso(value.attemptedAt)
    && isNullableIso(value.lastSuccessfulAt)
    && isNullableIso(value.dataAsOf)
    && isIso(value.nextExpectedAt)
    && DATASET_STATUSES.includes(value.status)
    && FRESHNESS_VALUES.includes(value.freshness)
    && Array.isArray(value.sourceHealth)
    && (value.fallbackReason === undefined || typeof value.fallbackReason === 'string');
}

export function deriveDatasetStatus({ attemptedAt, lastSuccessfulAt, dataAsOf, expectedIntervalMs, available, partial = false }) {
  if (!available || !lastSuccessfulAt || !dataAsOf) return 'unavailable';
  if (partial) return 'partial';
  const attemptedMs = new Date(attemptedAt).valueOf();
  const successfulMs = new Date(lastSuccessfulAt).valueOf();
  const dataMs = new Date(dataAsOf).valueOf();
  if (![attemptedMs, successfulMs, dataMs].every(Number.isFinite)) return 'unavailable';
  return attemptedMs - Math.max(successfulMs, dataMs) > expectedIntervalMs ? 'delayed' : 'fresh';
}

function summarizeStatus(datasets) {
  if (datasets.every(dataset => dataset.status === 'unavailable')) return 'unavailable';
  if (datasets.some(dataset => dataset.status === 'unavailable' || dataset.status === 'partial')) return 'partial';
  if (datasets.some(dataset => dataset.status === 'delayed')) return 'delayed';
  return 'fresh';
}

export function buildSiteSnapshot({ attemptedAt, datasets }) {
  const summaries = datasets.map(dataset => ({
    id: dataset.id,
    status: dataset.status,
    freshness: dataset.freshness,
    lastSuccessfulAt: dataset.lastSuccessfulAt,
    dataAsOf: dataset.dataAsOf,
    nextExpectedAt: dataset.nextExpectedAt,
    ...(dataset.fallbackReason ? { fallbackReason: dataset.fallbackReason } : {}),
  }));
  const successfulTimes = summaries.map(item => item.lastSuccessfulAt).filter(Boolean).sort();
  return {
    schemaVersion: 1,
    attemptedAt,
    lastSuccessfulAt: successfulTimes.at(-1) ?? null,
    status: summarizeStatus(summaries),
    datasets: summaries,
  };
}

export function validateSiteSnapshot(value) {
  return value?.schemaVersion === 1
    && isIso(value.attemptedAt)
    && isNullableIso(value.lastSuccessfulAt)
    && DATASET_STATUSES.includes(value.status)
    && Array.isArray(value.datasets)
    && value.datasets.length > 0
    && value.datasets.every(dataset => typeof dataset.id === 'string'
      && DATASET_STATUSES.includes(dataset.status)
      && FRESHNESS_VALUES.includes(dataset.freshness)
      && isNullableIso(dataset.lastSuccessfulAt)
      && isNullableIso(dataset.dataAsOf)
      && isIso(dataset.nextExpectedAt)
      && (dataset.fallbackReason === undefined || typeof dataset.fallbackReason === 'string'));
}
