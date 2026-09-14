import type { GlobalEvent, GlobalSituationSnapshot, SnapshotStatus } from './globalSituationTypes';

export interface FreshnessView { label: '最新' | '延迟' | '数据源异常' | '暂无数据'; tone: 'fresh' | 'delayed' | 'error'; detail: string }

export function deriveFreshness(snapshot: GlobalSituationSnapshot, now = new Date()): FreshnessView {
  if (snapshot.status === 'unavailable' || !snapshot.lastSuccessfulAt) return { label:'暂无数据', tone:'error', detail:'目前没有可验证的全球局势快照。' };
  if (snapshot.status === 'source_error') return { label:'数据源异常', tone:'error', detail:`当前数据更新出现异常，以下内容来自最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
  const age = now.valueOf() - new Date(snapshot.lastSuccessfulAt).valueOf();
  if (snapshot.status === 'delayed' || !Number.isFinite(age) || age > 3 * 3600_000) return { label:'延迟', tone:'delayed', detail:`部分来源延迟或快照超过 3 小时。最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
  return { label:'最新', tone:'fresh', detail:`最近一次成功抓取：${formatSnapshotTime(snapshot.lastSuccessfulAt)}` };
}

export function formatSnapshotTime(value: string | null) {
  if (!value) return '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN',{ month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Shanghai' }).format(date);
}

function isSnapshot(value: unknown): value is GlobalSituationSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GlobalSituationSnapshot>;
  return (item.schemaVersion === 1 || item.schemaVersion === 2) && typeof item.lastSuccessfulAt === 'string' && Array.isArray(item.events);
}

export async function loadGlobalSituation(fetcher: typeof fetch = fetch): Promise<GlobalSituationSnapshot> {
  try {
    let version = Date.now().toString();
    let updateStatus: { status?: SnapshotStatus; attemptedAt?: string; datasets?: Array<{id:string;status:SnapshotStatus;lastSuccessfulAt?:string|null}> } | undefined;
    try {
      const statusResponse = await fetcher(`${import.meta.env.BASE_URL}data/site-snapshot.json?t=${version}`, { cache:'no-store' });
      if (statusResponse.ok) { updateStatus = await statusResponse.json(); const situation=updateStatus?.datasets?.find(item=>item.id==='global-situation'); version = encodeURIComponent(situation?.lastSuccessfulAt ?? updateStatus?.attemptedAt ?? version); }
    } catch { /* The situation snapshot still has its own Last Successful metadata. */ }
    const response = await fetcher(`${import.meta.env.BASE_URL}data/global-situation.json?v=${version}`, { cache:'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const value: unknown = await response.json();
    if (!isSnapshot(value)) throw new Error('invalid snapshot');
    const situationStatus=updateStatus?.datasets?.find(item=>item.id==='global-situation')?.status;
    return { ...value, status:situationStatus ?? value.status, attemptedAt:updateStatus?.attemptedAt ?? value.attemptedAt };
  } catch {
    return { schemaVersion:2, attemptedAt:new Date().toISOString(), lastSuccessfulAt:null, status:'unavailable', sourceHealth:[{id:'frontend',name:'浏览器快照加载',status:'error',itemCount:0,error:'无法读取经过验证的动态快照'}], events:[] };
  }
}

export function eventsForKnowledge(events: GlobalEvent[], lessonId: string) {
  return events.filter(event => event.knowledgeIds.includes(lessonId));
}

export function findGlobalEvent(events: GlobalEvent[], id: string) { return events.find(event => event.id === id); }
