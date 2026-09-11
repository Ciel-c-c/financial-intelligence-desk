import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSnapshot } from './global-situation-core.mjs';
import { fetchSource, sources } from './fetch-global-situation.mjs';
import { promoteValidatedSnapshot, readJson, validateGlobalSituation, validateMacroEvents, validateMarketSnapshot, validateUpdateStatus, writeJsonAtomic } from './snapshot-schema.mjs';

const DATA_DIR = resolve('public/data');
const paths = { situation:resolve(DATA_DIR,'global-situation.json'), market:resolve(DATA_DIR,'market-snapshot.json'), macro:resolve(DATA_DIR,'macro-events.json'), status:resolve(DATA_DIR,'update-status.json') };

function xmlEntities(value='') { return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'"); }

export function parseEcbFx(xml, fetchedAt) {
  const date = xml.match(/time=['"]([^'"]+)['"]/)?.[1];
  if (!date) return [];
  // ECB's daily file exposes a reference date, not an intraday publication time.
  const timestamp = new Date(`${date}T00:00:00Z`).toISOString();
  const age = new Date(fetchedAt).valueOf() - new Date(timestamp).valueOf();
  return [...xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)].filter(match => ['USD','JPY','GBP','CNY'].includes(match[1])).map(match => ({ id:`EUR${match[1]}`, label:`欧元兑${match[1]}`, value:Number(match[2]), unit:match[1], timestamp, source:{ name:'European Central Bank', url:'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html' }, freshness:age <= 36*3600_000 ? 'fresh':'delayed' }));
}

async function fetchMarket(attemptedAt) {
  const url = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
  try {
    const response = await fetch(url, { signal:AbortSignal.timeout(15_000), headers:{'user-agent':'Financial-Lens-Snapshot/2.0'} });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const instruments = parseEcbFx(xmlEntities(await response.text()), attemptedAt);
    if (!instruments.length) throw new Error('No supported ECB rates');
    return { schemaVersion:1, generatedAt:attemptedAt, status:instruments.some(item => item.freshness === 'delayed') ? 'delayed':'fresh', instruments };
  } catch (error) { return { error:error instanceof Error ? error.message:String(error) }; }
}

function macroFrom(snapshot, attemptedAt) {
  return { schemaVersion:1, generatedAt:attemptedAt, events:snapshot.events.filter(event => ['monetary-policy','fiscal-policy','trade-policy','economic-policy'].includes(event.eventType)).slice(0,10).map(event => ({ id:event.id, headline:event.headline, eventType:event.eventType, region:event.region, publishedAt:event.latestSourceAt, sourceUrl:event.sources[0].url, relatedKnowledgePoints:event.relatedKnowledgePoints })) };
}

export async function updateSnapshots({ now = new Date().toISOString(), sourceResults, marketResult } = {}) {
  const previousSituation = await readJson(paths.situation);
  const previousMarket = await readJson(paths.market);
  const results = sourceResults ?? await Promise.all(sources.map(source => fetchSource(source, now)));
  const candidateSituation = buildSnapshot({ attemptedAt:now, sourceResults:results, previous:previousSituation });
  const situationValid = candidateSituation.status !== 'source_error' && validateGlobalSituation(candidateSituation);
  if (situationValid) await promoteValidatedSnapshot({ path:paths.situation, candidate:candidateSituation, validate:validateGlobalSituation });
  const activeSituation = situationValid ? candidateSituation : previousSituation;

  const marketCandidate = marketResult ?? await fetchMarket(now);
  const marketValid = validateMarketSnapshot(marketCandidate);
  if (marketValid) await promoteValidatedSnapshot({ path:paths.market, candidate:marketCandidate, validate:validateMarketSnapshot });

  let macroValid = false;
  if (activeSituation && validateGlobalSituation(activeSituation)) {
    const macro = macroFrom(activeSituation, now); macroValid = validateMacroEvents(macro);
    if (macroValid) await writeJsonAtomic(paths.macro, macro);
  }
  const previousStatus = await readJson(paths.status);
  const lastSuccessfulAt = situationValid ? now : (previousSituation?.lastSuccessfulAt ?? previousStatus?.lastSuccessfulAt ?? now);
  const status = { schemaVersion:1, attemptedAt:now, lastSuccessfulAt, status:!situationValid ? 'source_error' : (!marketValid || candidateSituation.status === 'delayed' ? 'delayed':'fresh'), datasets:[
    { id:'global-situation', status:situationValid ? candidateSituation.status:'source_error', lastSuccessfulAt },
    { id:'market-snapshot', status:marketValid ? marketCandidate.status:'source_error', lastSuccessfulAt:marketValid ? now : (previousMarket?.generatedAt ?? null) },
    { id:'macro-events', status:macroValid ? (situationValid ? candidateSituation.status:'delayed'):'source_error', lastSuccessfulAt:macroValid ? now:null },
  ], sourceHealth:candidateSituation.sourceHealth ?? [], message:!situationValid ? '本轮主要来源失败或候选快照未通过校验，继续使用最近一次成功快照。':undefined };
  if (!validateUpdateStatus(status)) throw new Error('Generated update status is invalid');
  await writeJsonAtomic(paths.status, status);
  process.stdout.write(`Snapshots: situation=${situationValid}, market=${marketValid}, macro=${macroValid}, status=${status.status}\n`);
  return { situationPromoted:situationValid, marketPromoted:marketValid, status };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) updateSnapshots().catch(error => { console.error(error); process.exitCode=1; });
