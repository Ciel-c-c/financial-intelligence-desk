import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runSiteUpdate, shouldGenerateBrief } from '../../scripts/update-site-data.mjs';

const folders: string[] = [];
afterEach(async () => Promise.all(folders.splice(0).map(path => rm(path, { recursive: true, force: true }))));

const snapshot = (id: string) => ({ schemaVersion: 1, attemptedAt: '2026-09-14T02:00:00Z', lastSuccessfulAt: '2026-09-14T02:00:00Z', dataAsOf: '2026-09-14T01:00:00Z', nextExpectedAt: '2026-09-14T03:00:00Z', status: 'fresh', freshness: 'delayed', sourceHealth: [], id });

describe('site update orchestration', () => {
  it('isolates a market failure and still publishes a unified status index', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'lens-site-update-')); folders.push(dataDir);
    const result = await runSiteUpdate({ now: '2026-09-14T02:00:00Z', dataDir, datasetRunners: {
      'news-feed': async () => snapshot('news-feed'),
      'market-overview': async () => { throw new Error('market timeout'); },
      'sector-performance': async () => snapshot('sector-performance'),
      'global-situation': async () => snapshot('global-situation'),
      'daily-brief': async () => snapshot('daily-brief'),
    } });
    expect(result.datasets['news-feed'].promoted).toBe(true);
    expect(result.datasets['market-overview'].status).toBe('unavailable');
    expect(result.siteSnapshot.status).toBe('partial');
    expect(result.siteSnapshot.datasets).toHaveLength(5);
    expect(JSON.parse(await readFile(join(dataDir, 'site-snapshot.json'), 'utf8'))).toEqual(result.siteSnapshot);
  });

  it('does not write files during dry run', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'lens-site-dry-')); folders.push(dataDir);
    await runSiteUpdate({ now: '2026-09-14T02:00:00Z', dataDir, dryRun: true, datasetRunners: { 'news-feed': async () => snapshot('news-feed') } });
    await expect(readFile(join(dataDir, 'site-snapshot.json'))).rejects.toThrow();
  });

  it('deploy workflow has a single push-based deployment path', async () => {
    const workflow = await readFile('.github/workflows/deploy-pages.yml', 'utf8');
    expect(workflow).not.toContain('workflow_run:');
    expect(workflow).toContain('push:');
  });

  it('generates briefs only in Beijing morning and market-close windows', () => {
    expect(shouldGenerateBrief('2026-09-14T22:17:00Z')).toBe(true);
    expect(shouldGenerateBrief('2026-09-15T08:17:00Z')).toBe(true);
    expect(shouldGenerateBrief('2026-09-15T09:17:00Z')).toBe(false);
  });
});
