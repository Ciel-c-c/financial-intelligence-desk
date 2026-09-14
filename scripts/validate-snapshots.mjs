import { resolve } from 'node:path';
import { readJson, validateGlobalSituation, validateMacroEvents, validateMarketOverview, validateNewsSnapshot, validateSiteSnapshot, validateUpdateStatus } from './snapshot-schema.mjs';
const checks = [['global-situation.json',validateGlobalSituation],['market-overview.json',validateMarketOverview],['macro-events.json',validateMacroEvents],['news-feed.json',validateNewsSnapshot],['update-status.json',validateUpdateStatus],['site-snapshot.json',validateSiteSnapshot]];
for (const [name, validate] of checks) { const value=await readJson(resolve('public/data',name)); if (!validate(value)) throw new Error(`Invalid snapshot: ${name}`); }
process.stdout.write('All data snapshots are valid.\n');
