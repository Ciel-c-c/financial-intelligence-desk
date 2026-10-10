import { resolve } from 'node:path';
import { readJson, validateDailyBrief, validateGlobalSituation, validateMacroEvents, validateMarketOverview, validateNewsSnapshot, validateSectorPerformance, validateSiteSnapshot, validateUpdateStatus } from './snapshot-schema.mjs';
import {validateMarketSessions} from './site/market-sessions.mjs';
const checks = [['global-situation.json',validateGlobalSituation],['market-overview.json',validateMarketOverview],['sector-performance.json',validateSectorPerformance],['daily-brief.json',validateDailyBrief],['macro-events.json',validateMacroEvents],['news-feed.json',validateNewsSnapshot],['update-status.json',validateUpdateStatus],['site-snapshot.json',validateSiteSnapshot]];
for (const [name, validate] of checks) { const value=await readJson(resolve('public/data',name)); if (!validate(value)) throw new Error(`Invalid snapshot: ${name}`); }
const sessions=await readJson(resolve('public/data/market-sessions.json'));if(sessions!==undefined&&!validateMarketSessions(sessions))throw Error('Invalid snapshot: market-sessions.json');
process.stdout.write('All data snapshots are valid.\n');
