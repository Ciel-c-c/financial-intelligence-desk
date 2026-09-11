import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSnapshot, parseFeed } from './global-situation-core.mjs';

export const sources = [
  { id:'fed', name:'Federal Reserve', url:'https://www.federalreserve.gov/feeds/press_all.xml' },
  { id:'ecb', name:'European Central Bank', url:'https://www.ecb.europa.eu/rss/press.html' },
  { id:'boj', name:'Bank of Japan', url:'https://www.boj.or.jp/en/rss/whatsnew.xml' },
  { id:'un', name:'UN News', url:'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
];

function argument(name, fallback) {
  const position = process.argv.indexOf(`--${name}`);
  return position >= 0 ? process.argv[position + 1] : fallback;
}

async function readSnapshot(path) {
  if (!path) return undefined;
  try { return JSON.parse(await readFile(resolve(path), 'utf8')); } catch { return undefined; }
}

export async function fetchSource(source, fetchedAt) {
  try {
    const response = await fetch(source.url, { headers:{ 'user-agent':'Financial-Lens-Snapshot/1.0 (+https://github.com/Ciel-c-c/financial-intelligence-desk)', accept:'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal:AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = parseFeed(await response.text(), source, fetchedAt).slice(0, 30);
    if (!items.length) throw new Error('Feed contained no usable items');
    return { id:source.id, name:source.name, ok:true, items };
  } catch (error) {
    return { id:source.id, name:source.name, ok:false, items:[], error:error instanceof Error ? error.message : String(error) };
  }
}

export async function run() {
  const output = resolve(argument('output', 'public/data/global-situation.json'));
  const previous = await readSnapshot(argument('previous', output));
  const attemptedAt = new Date().toISOString();
  const sourceResults = await Promise.all(sources.map(source => fetchSource(source, attemptedAt)));
  const snapshot = buildSnapshot({ attemptedAt, sourceResults, previous });
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const ok = sourceResults.filter(result => result.ok).length;
  process.stdout.write(`Global situation snapshot: ${snapshot.events.length} events, ${ok}/${sources.length} sources, status=${snapshot.status}\n`);
  if (!ok && !snapshot.events.length) process.exitCode = 1;
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) run();
