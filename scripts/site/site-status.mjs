import { buildSiteSnapshot, validateSiteSnapshot } from './site-contract.mjs';
import { writeJsonAtomic } from '../snapshot-schema.mjs';

export async function publishSiteSnapshot({ path, attemptedAt, datasets }) {
  const snapshot = buildSiteSnapshot({ attemptedAt, datasets });
  if (!validateSiteSnapshot(snapshot)) throw new Error('Generated site snapshot is invalid');
  await writeJsonAtomic(path, snapshot);
  return snapshot;
}
