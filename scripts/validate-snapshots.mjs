import { resolve } from 'node:path';
import { readJson, validateGlobalSituation, validateMacroEvents, validateMarketSnapshot, validateNewsSnapshot, validateUpdateStatus } from './snapshot-schema.mjs';
const checks = [['global-situation.json',validateGlobalSituation],['market-snapshot.json',validateMarketSnapshot],['macro-events.json',validateMacroEvents],['news-feed.json',validateNewsSnapshot],['update-status.json',validateUpdateStatus]];
for (const [name, validate] of checks) { const value=await readJson(resolve('public/data',name)); if (!validate(value)) throw new Error(`Invalid snapshot: ${name}`); }
process.stdout.write('All data snapshots are valid.\n');
