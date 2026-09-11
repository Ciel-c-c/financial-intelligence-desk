import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());
const isStringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string');

export function validateGlobalSituation(value) {
  if (!value || value.schemaVersion !== 2 || !isIso(value.lastSuccessfulAt) || !['fresh','delayed','source_error'].includes(value.status) || !Array.isArray(value.events) || !value.events.length) return false;
  return value.events.every(event => event && typeof event.id === 'string' && typeof event.headline === 'string' && typeof event.oneSentenceExplanation === 'string' && Array.isArray(event.sources) && event.sources.length > 0 && isIso(event.firstPublishedAt) && isIso(event.latestSourceAt) && isIso(event.fetchedAt) && ['high','medium','low'].includes(event.marketRelevance) && Number.isInteger(event.marketRelevanceScore) && isStringArray(event.relevanceReasons) && isStringArray(event.relatedIndustries) && isStringArray(event.relatedKnowledgePoints) && typeof event.factSummary === 'string' && Array.isArray(event.marketView) && Array.isArray(event.scenarios) && Array.isArray(event.impactChain) && isStringArray(event.watchConditions));
}

export function validateMarketSnapshot(value) {
  return value?.schemaVersion === 1 && isIso(value.generatedAt) && Array.isArray(value.instruments) && value.instruments.every(item => typeof item.id === 'string' && typeof item.value === 'number' && isIso(item.timestamp) && typeof item.source?.url === 'string' && ['fresh','delayed'].includes(item.freshness));
}

export function validateMacroEvents(value) {
  return value?.schemaVersion === 1 && isIso(value.generatedAt) && Array.isArray(value.events) && value.events.every(item => typeof item.id === 'string' && typeof item.headline === 'string' && isIso(item.publishedAt) && typeof item.sourceUrl === 'string');
}

export function validateUpdateStatus(value) {
  return value?.schemaVersion === 1 && isIso(value.attemptedAt) && isIso(value.lastSuccessfulAt) && ['fresh','delayed','source_error'].includes(value.status) && Array.isArray(value.datasets);
}

export async function writeJsonAtomic(path, value) {
  const target = resolve(path); const temporary = `${target}.tmp`;
  await mkdir(dirname(target), { recursive:true });
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, target);
}

export async function readJson(path) { try { return JSON.parse(await readFile(resolve(path), 'utf8')); } catch { return undefined; } }

export async function promoteValidatedSnapshot({ path, candidate, validate }) {
  if (!validate(candidate)) return { promoted:false, reason:'invalid_candidate' };
  await writeJsonAtomic(path, candidate);
  return { promoted:true };
}
