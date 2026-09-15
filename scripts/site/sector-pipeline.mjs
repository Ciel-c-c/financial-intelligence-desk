import { validateDatasetEnvelope } from './site-contract.mjs';
import { MARKET_GROUPS } from './market-pipeline.mjs';

const REGION_BY_MARKET = {
  aShare: ['中国', 'A股相关'],
  hongKong: ['中国', '香港', '港股相关'],
  us: ['美国', '美股相关'],
  globalAssets: ['全球'],
};
const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());

export function matchDriverEvidence(sector, evidence = []) {
  const regions = REGION_BY_MARKET[sector.market] ?? [];
  const matches = evidence.filter(item =>
    item.regions?.some(region => regions.includes(region))
    && item.topicIds?.some(id => sector.driverTopicIds?.includes(id))
    && item.causalNodes?.includes(sector.requiredMechanism)
    && typeof item.explanation === 'string');
  return matches.length ? {
    summary: matches[0].explanation,
    evidenceIds: matches.map(item => item.id),
    confidence: 'supported',
  } : undefined;
}

function validInput(item) {
  return item && typeof item.id === 'string' && MARKET_GROUPS.includes(item.market)
    && typeof item.classification === 'string' && typeof item.name === 'string'
    && Number.isFinite(item.changePercent) && isIso(item.dataAsOf)
    && typeof item.source?.url === 'string';
}

export function buildSectorPerformance({ attemptedAt, marketInputs = [], evidence = [] }) {
  const groups = Object.fromEntries(MARKET_GROUPS.map(group => {
    const candidates = marketInputs.filter(item => item.market === group && validInput(item));
    const classification = candidates[0]?.classification;
    const items = candidates.filter(item => item.classification === classification)
      .sort((left, right) => right.changePercent - left.changePercent)
      .map((item, index) => {
        const driver = matchDriverEvidence(item, evidence);
        return { id: item.id, market: item.market, classification: item.classification, name: item.name, changePercent: item.changePercent, rank: index + 1, dataAsOf: new Date(item.dataAsOf).toISOString(), source: item.source, ...(driver ? { driver } : {}) };
      });
    return [group, items];
  }));
  const items = Object.values(groups).flat();
  const dataAsOf = items.map(item => item.dataAsOf).sort().at(-1) ?? null;
  return {
    schemaVersion: 1,
    attemptedAt,
    lastSuccessfulAt: items.length ? attemptedAt : null,
    dataAsOf,
    nextExpectedAt: new Date(new Date(attemptedAt).valueOf() + 3_600_000).toISOString(),
    status: items.length ? 'fresh' : 'unavailable',
    freshness: items.length ? 'close' : 'historical',
    sourceHealth: [...new Map(items.map(item => [item.source.id ?? item.source.name, { id: item.source.id ?? item.source.name, status: 'ok', itemCount: items.filter(candidate => candidate.source.url === item.source.url).length }])).values()],
    ...(items.length ? {} : { fallbackReason: '尚未接入经过许可和核验的行业表现来源' }),
    groups,
  };
}

function validSector(item, group) {
  return item?.market === group && typeof item.id === 'string' && typeof item.name === 'string'
    && typeof item.classification === 'string' && Number.isFinite(item.changePercent)
    && Number.isInteger(item.rank) && item.rank > 0 && isIso(item.dataAsOf)
    && typeof item.source?.url === 'string'
    && (item.driver === undefined || item.driver.confidence === 'supported' && Array.isArray(item.driver.evidenceIds) && item.driver.evidenceIds.length > 0);
}

export function validateSectorPerformance(value) {
  return validateDatasetEnvelope(value)
    && MARKET_GROUPS.every(group => Array.isArray(value.groups?.[group])
      && value.groups[group].every(item => validSector(item, group))
      && new Set(value.groups[group].map(item => item.classification)).size <= 1);
}
