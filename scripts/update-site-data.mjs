import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, writeJsonAtomic } from './snapshot-schema.mjs';
import { updateSnapshots } from './update-data-snapshots.mjs';
import { updateNewsFeed } from './news/update-news-feed.mjs';
import { buildDailyBrief } from './site/brief-pipeline.mjs';
import { buildSiteSnapshot } from './site/site-contract.mjs';

const DATASET_IDS = ['news-feed', 'market-overview', 'sector-performance', 'global-situation', 'daily-brief'];
export function selectBriefNews(news,now){
 return (news?.latest??[]).filter(record=>{
  const age=Date.parse(now)-Date.parse(record.publishedAt),article=record.article,review=record.editorial,item=review?.item;
  return age>=0&&age<=86400_000&&article?.status==='complete'&&/^[a-f0-9]{64}$/.test(article.sha256)
   &&review?.sourceBodyHash===article.sha256&&review.originalTitle===record.originalTitle
   &&item?.id===record.id&&item.publishedAt===record.publishedAt&&item.sourceUrl===record.canonicalUrl&&article.sourceUrl===record.canonicalUrl
   &&(review.language==='en'?item.title===record.titleEn&&item.summary===record.summaryEn:item.title===record.titleZh&&item.summary===record.summaryZh)
   &&[item.facts,item.consensus,item.inference,item.risks,item.causalChain,review.watchItems].every(section=>Array.isArray(section)&&section.length>0);
 }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,8);
}

function latest(items, field) {
  return (items ?? []).map(item => item[field]).filter(value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf())).sort().at(-1) ?? null;
}

function datasetSummary(id, snapshot, error, now) {
  if (!snapshot) return { id, status: 'unavailable', freshness: 'historical', lastSuccessfulAt: null, dataAsOf: null, nextExpectedAt: new Date(Date.parse(now) + 3_600_000).toISOString(), fallbackReason: error ?? '尚未获得有效快照' };
  const lastSuccessfulAt = snapshot.lastSuccessfulAt ?? null;
  const dataAsOf = snapshot.dataAsOf
    ?? (id === 'news-feed' ? latest([...(snapshot.latest ?? []), ...(snapshot.continuing ?? [])], 'publishedAt') : null)
    ?? (id === 'global-situation' ? latest(snapshot.events, 'latestSourceAt') : null)
    ?? lastSuccessfulAt;
  const mappedStatus = snapshot.status === 'source_error' ? (lastSuccessfulAt ? 'delayed' : 'unavailable') : snapshot.status === 'delayed' && snapshot.sourceHealth?.some(source => source.status === 'ok') ? 'partial' : snapshot.status;
  return {
    id,
    status: ['fresh', 'partial', 'delayed', 'unavailable'].includes(mappedStatus) ? mappedStatus : 'delayed',
    freshness: snapshot.freshness ?? (lastSuccessfulAt ? 'delayed' : 'historical'),
    lastSuccessfulAt,
    dataAsOf,
    nextExpectedAt: snapshot.nextExpectedAt ?? new Date(Date.parse(now) + 3_600_000).toISOString(),
    ...((error || snapshot.fallbackReason || snapshot.message) ? { fallbackReason: error ?? snapshot.fallbackReason ?? snapshot.message } : {}),
  };
}

function briefEdition(now) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', hour12: false }).format(new Date(now)));
  return hour < 12 ? 'morning' : 'close';
}

export function shouldGenerateBrief(now) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', hour12: false }).format(new Date(now)));
  return hour === 6 || hour === 16;
}

function versionOf(snapshot) {
  return snapshot?.lastSuccessfulAt ?? snapshot?.attemptedAt ?? 'unavailable';
}

async function runDefaultDatasets({ now, dataDir, dryRun }) {
  if (!dryRun) {
    await Promise.allSettled([
      updateSnapshots({ now }),
      updateNewsFeed({ now, outputPath: join(dataDir, 'news-feed.json'), statusPath: undefined }),
    ]);
  }
  const snapshots = Object.fromEntries(await Promise.all(DATASET_IDS.filter(id => id !== 'daily-brief').map(async id => [id, await readJson(join(dataDir, `${id}.json`))])));
  const news = snapshots['news-feed'];
  const market = snapshots['market-overview'];
  const reviewedNews=selectBriefNews(news,now);
  const facts = [
    ...reviewedNews.slice(0,3).flatMap(item=>item.editorial.item.facts),
    ...Object.values(market?.groups ?? {}).flat().slice(0, 2).map(item => `${item.name}：${item.value}${item.unit ? ` ${item.unit}` : ''}`),
  ];
  const existingBrief = await readJson(join(dataDir, 'daily-brief.json'));
  const currentStories = reviewedNews.map(item => ({ id:item.id, title:item.editorial.item.title, publishedAt:item.publishedAt, sourceName:item.sourceName, sourceUrl:item.canonicalUrl }));
  const brief = !shouldGenerateBrief(now) && existingBrief?.stories?.length && existingBrief.snapshotVersions?.news === versionOf(news) ? existingBrief : buildDailyBrief({
    edition: briefEdition(now), generatedAt: now,
    snapshots: {
      market: { version: versionOf(market), dataAsOf: market?.dataAsOf },
      sectors: { version: versionOf(snapshots['sector-performance']), dataAsOf: snapshots['sector-performance']?.dataAsOf },
      news: { version: versionOf(news), dataAsOf: latest(news?.latest, 'publishedAt') },
      situation: { version: versionOf(snapshots['global-situation']), dataAsOf: latest(snapshots['global-situation']?.events, 'latestSourceAt') },
    },
    facts,
    stories: currentStories,
    watchItems: [...new Set(reviewedNews.flatMap(item=>item.editorial.watchItems))].slice(0,8),
    invalidationConditions: [...new Set(reviewedNews.flatMap(item=>item.editorial.item.risks))].slice(0,8),
  });
  snapshots['daily-brief'] = brief;
  if (!dryRun && brief !== existingBrief) await writeJsonAtomic(join(dataDir, 'daily-brief.json'), brief);
  return snapshots;
}

export async function runSiteUpdate({ now = new Date().toISOString(), dataDir = resolve('public/data'), dryRun = false, datasetRunners } = {}) {
  const datasets = {};
  if (datasetRunners) {
    const entries = Object.entries(datasetRunners);
    const settled = await Promise.allSettled(entries.map(([, runner]) => runner()));
    entries.forEach(([id], index) => {
      const result = settled[index];
      datasets[id] = result.status === 'fulfilled'
        ? { promoted: true, status: result.value.status, snapshot: result.value }
        : { promoted: false, status: 'unavailable', error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
    });
  } else {
    const snapshots = await runDefaultDatasets({ now, dataDir, dryRun });
    for (const id of DATASET_IDS) datasets[id] = snapshots[id]
      ? { promoted: !dryRun, status: snapshots[id].status, snapshot: snapshots[id] }
      : { promoted: false, status: 'unavailable', error: 'snapshot missing' };
  }
  const summaries = DATASET_IDS.map(id => datasetSummary(id, datasets[id]?.snapshot, datasets[id]?.error, now));
  const siteSnapshot = buildSiteSnapshot({ attemptedAt: now, datasets: summaries });
  if (!dryRun) await writeJsonAtomic(join(dataDir, 'site-snapshot.json'), siteSnapshot);
  process.stdout.write(`${dryRun ? 'Dry run' : 'Site update'}: ${summaries.map(item => `${item.id}=${item.status}`).join(', ')}\n`);
  return { datasets, siteSnapshot };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runSiteUpdate({ dryRun: process.argv.includes('--dry-run') }).catch(error => { console.error(error); process.exitCode = 1; });
}
