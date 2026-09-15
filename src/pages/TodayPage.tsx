import { useMemo, useState } from 'react';
import { CoreTransmission } from '../components/CoreTransmission';
import { MarketOverview } from '../components/MarketOverview';
import { NewsFeedSections } from '../components/NewsFeedSections';
import { SectorPerformance } from '../components/SectorPerformance';
import { useGlobalSituation } from '../data/useGlobalSituation';
import { useNewsFeed } from '../data/useNewsFeed';
import { useSiteData } from '../data/useSiteData';
import type { MarketGroup } from '../data/siteSnapshotTypes';

export function TodayPage() {
  const { snapshot: newsSnapshot, loading: newsLoading, error: newsError } = useNewsFeed();
  const { market, sectors } = useSiteData();
  const rawSituation = useGlobalSituation();
  const situation = { ...rawSituation, events: rawSituation.events.filter(event => Date.now() - Date.parse(event.latestSourceAt ?? event.publishedAt) <= 24 * 3600_000) };
  const [marketTab, setMarketTab] = useState<MarketGroup>('aShare');
  const recentEvents = situation.events.filter(event => Date.now() - Date.parse(event.latestSourceAt ?? event.publishedAt) <= 24 * 3600_000);
  const featured = [...recentEvents].sort((a, b) => Date.parse(b.latestSourceAt ?? b.publishedAt) - Date.parse(a.latestSourceAt ?? a.publishedAt) || b.relevance.score - a.relevance.score)[0];
  const chain = useMemo(() => featured?.causalChain?.length >= 3 ? {
    nodes: featured.causalChain.slice(0, 6).map(node => ({ title: node.title, detail: node.beginnerExplanation })),
    condition: featured.conditionsThatChangeView?.[0] ?? '这是一条可能路径，事件、政策或供需条件变化都可能让传导失效。',
    evidenceUrl: featured.sources?.[0]?.url,
  } : undefined, [featured]);

  return <main className="page today-page">
    <NewsFeedSections snapshot={newsSnapshot} loading={newsLoading} error={newsError} />
    <MarketOverview snapshot={market} activeGroup={marketTab} onGroupChange={setMarketTab} />
    <div className="dashboard-split"><SectorPerformance snapshot={sectors} activeGroup={marketTab} /><CoreTransmission chain={chain} /></div>
    <section aria-labelledby="political-title"><div className="section-heading"><div><p className="eyebrow">政策 · 国际关系 · 地缘冲突</p><h2 id="political-title">政策与地缘传导</h2></div><span>{situation.events.length} 个事件</span></div>{situation.events.length ? <div className="political-grid">{situation.events.slice(0, 6).map(event => <article className="political-card" key={event.id}><span className="eyebrow">{event.region}</span><h3>{event.headline}</h3><p>{event.oneLine ?? event.oneSentenceExplanation}</p><small>数据时间：{new Date(event.latestSourceAt ?? event.publishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</small></article>)}</div> : <p className="empty-state">当前没有可验证的动态政策与地缘事件。</p>}</section>
  </main>;
}
