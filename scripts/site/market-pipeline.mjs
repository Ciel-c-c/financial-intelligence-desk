import { validateDatasetEnvelope } from './site-contract.mjs';
import {validateObservation,dateInZone} from '../../src/data/marketObservationValidation.mjs';

export const MARKET_GROUPS = ['aShare', 'hongKong', 'us', 'globalAssets'];
const ITEM_FRESHNESS = ['fresh', 'delayed'];
const MARKET_STATES = ['trading', 'delayed', 'close', 'previous_close'];

const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());

function dayInZone(value, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(value));
}

export function resolveMarketState(group, now, dataAsOf) {
  const timeZone = group === 'us' ? 'America/New_York' : group === 'aShare' || group === 'hongKong' ? 'Asia/Shanghai' : 'UTC';
  const weekday = dayInZone(now, timeZone);
  if (weekday === 'Sat' || weekday === 'Sun') return 'previous_close';
  const nowDay = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  const dataDay = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dataAsOf));
  if (nowDay !== dataDay) return 'previous_close';
  if (group === 'globalAssets') return 'delayed';
  const minutes = value => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(new Date(value));
    return Number(parts.find(part => part.type === 'hour').value) * 60 + Number(parts.find(part => part.type === 'minute').value);
  };
  // A date match does not prove a close: the observation itself must be at
  // or after the regular closing time. Holidays retain the prior dated quote.
  const closeMinute = group === 'aShare' ? 15 * 60 : 16 * 60;
  return minutes(now) >= closeMinute && minutes(dataAsOf) >= closeMinute ? 'close' : 'delayed';
}

function validInstrument(item) {
  return item && typeof item.id === 'string' && MARKET_GROUPS.includes(item.group)
    && typeof item.name === 'string' && typeof item.symbol === 'string'
    && Number.isFinite(item.value) && isIso(item.dataAsOf)
    && typeof item.source?.url === 'string' && ITEM_FRESHNESS.includes(item.freshness)
    && MARKET_STATES.includes(item.marketState);
}
function stateFor(item,now){
 if(!item.session)return item.marketState==='delayed'?resolveMarketState(item.group,now,item.dataAsOf):item.marketState;
 if(item.session!=='close')return 'delayed';
 return item.tradingDate===dateInZone(now,item.timeZone)?'close':'previous_close';
}

function latestIso(items, field) {
  return items.map(item => item[field]).filter(isIso).sort().at(-1) ?? null;
}

export function buildMarketOverview({ attemptedAt, sourceResults = [], previous } = {}) {
  const groups = {};
  const groupHealth = {};
  let fetchedNewInstruments = false;
  for (const group of MARKET_GROUPS) {
    const relevant = sourceResults.filter(result => result.market === group);
    const current = relevant.flatMap(result => result.status === 'ok' ? result.instruments ?? [] : []).filter(item=>validInstrument(item)&&item.group===group&&(!item.session||validateObservation(item,attemptedAt)))
      .map(item => ({ ...item, marketState:stateFor(item,attemptedAt) }));
    const prior = previous?.groups?.[group]?.filter(item=>validInstrument(item)&&(!item.session||validateObservation(item,attemptedAt))) ?? [];
    const failures = relevant.filter(result => result.status !== 'ok');
    if (current.length) {
      const retained=prior.filter(old=>!current.some(item=>item.id===old.id)).map(item=>({...item,freshness:'delayed',marketState:stateFor(item,attemptedAt)}));
      fetchedNewInstruments ||= current.some(item=>!prior.some(old=>old.id===item.id&&old.value===item.value&&old.changePercent===item.changePercent&&old.dataAsOf===item.dataAsOf));
      groups[group] = [...current,...retained];
      groupHealth[group] = { status: failures.length||retained.length ? 'partial' : 'fresh', sourceIds: relevant.filter(result => result.status === 'ok').map(result => result.sourceId), ...(failures.length||retained.length ? { fallbackReason: failures.map(result => result.error ?? `${result.sourceId} failed`).join('; ')||'部分观察项沿用最近有效数据' } : {}) };
      continue;
    }
    if (prior.length) {
      groups[group] = prior.map(item => ({ ...item, freshness: 'delayed', marketState:item.session?stateFor(item,attemptedAt):resolveMarketState(group, attemptedAt, item.dataAsOf) }));
      groupHealth[group] = { status: 'delayed', sourceIds: [], fallbackReason: failures.map(result => result.error).filter(Boolean).join('; ') || '本轮没有获得有效新数据，沿用最近成功快照' };
    } else {
      groups[group] = [];
      groupHealth[group] = { status: 'unavailable', sourceIds: [], fallbackReason: failures.map(result => result.error).filter(Boolean).join('; ') || '尚未获得经过验证的数据' };
    }
  }
  const items = Object.values(groups).flat();
  const statuses = Object.values(groupHealth).map(value => value.status);
  const status = statuses.every(value => value === 'unavailable') ? 'unavailable' : statuses.some(value => value !== 'fresh') ? 'partial' : 'fresh';
  const dataAsOf = latestIso(items, 'dataAsOf');
  const lastSuccessfulAt = fetchedNewInstruments ? attemptedAt : previous?.lastSuccessfulAt ?? null;
  return {
    schemaVersion: 1,
    attemptedAt,
    lastSuccessfulAt,
    dataAsOf,
    nextExpectedAt: new Date(new Date(attemptedAt).valueOf() + 3_600_000).toISOString(),
    status,
    freshness: items.some(item => item.freshness === 'delayed') ? 'delayed' : items.length ? 'close' : 'historical',
    sourceHealth: sourceResults.map(result => ({ id: result.sourceId, status: result.status, itemCount: result.instruments?.length ?? 0, ...(result.error ? { error: result.error } : {}) })),
    ...(status === 'unavailable' ? { fallbackReason: '所有市场分组均暂无可靠数据' } : {}),
    groups,
    groupHealth,
  };
}

export function validateMarketOverview(value) {
  return validateDatasetEnvelope(value)
    && MARKET_GROUPS.every(group => Array.isArray(value.groups?.[group]) && value.groups[group].every(validInstrument))
    && MARKET_GROUPS.every(group => ['fresh', 'partial', 'delayed', 'unavailable'].includes(value.groupHealth?.[group]?.status));
}
