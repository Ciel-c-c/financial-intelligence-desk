import { globalSituationSeed } from './globalSituationSeed';
import type { GlobalEvent, GlobalSituationSnapshot } from './globalSituationTypes';

export interface FreshnessView { label: '最新' | '延迟' | '数据源异常'; tone: 'fresh' | 'delayed' | 'error'; detail: string }

export function deriveFreshness(snapshot: GlobalSituationSnapshot, now = new Date()): FreshnessView {
  if (snapshot.status === 'source_error') return { label:'数据源异常', tone:'error', detail:`当前数据更新出现异常，以下内容来自最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
  const age = now.valueOf() - new Date(snapshot.lastSuccessfulAt).valueOf();
  if (snapshot.status === 'partial' || !Number.isFinite(age) || age > 3 * 3600_000) return { label:'延迟', tone:'delayed', detail:`部分来源延迟或快照超过 3 小时。最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
  return { label:'最新', tone:'fresh', detail:`最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
}

export function formatSnapshotTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN',{ month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Shanghai' }).format(date);
}

function isSnapshot(value: unknown): value is GlobalSituationSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GlobalSituationSnapshot>;
  return item.schemaVersion === 1 && typeof item.lastSuccessfulAt === 'string' && Array.isArray(item.events);
}

export async function loadGlobalSituation(fetcher: typeof fetch = fetch): Promise<GlobalSituationSnapshot> {
  try {
    const response = await fetcher(`${import.meta.env.BASE_URL}data/global-situation.json`, { cache:'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const value: unknown = await response.json();
    if (!isSnapshot(value)) throw new Error('invalid snapshot');
    const recentSeed = globalSituationSeed.events.filter(event => Math.abs(new Date(value.lastSuccessfulAt).valueOf() - new Date(event.publishedAt).valueOf()) <= 7 * 24 * 3600_000);
    const liveIds = new Set(value.events.map(event => event.id));
    return { ...value, events:[...recentSeed.filter(event => !liveIds.has(event.id)),...value.events] };
  } catch {
    return { ...globalSituationSeed, status:'source_error', sourceHealth:[...globalSituationSeed.sourceHealth,{id:'frontend',name:'浏览器快照加载',status:'error',itemCount:0,error:'已回退到随版本发布的快照'}] };
  }
}

export function eventsForKnowledge(events: GlobalEvent[], lessonId: string) {
  return events.filter(event => event.knowledgeIds.includes(lessonId));
}

export function findGlobalEvent(events: GlobalEvent[], id: string) { return events.find(event => event.id === id); }
