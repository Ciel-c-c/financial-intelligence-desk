import { useMemo, useState } from 'react';
import { CoreTransmission } from '../components/CoreTransmission';
import { isRecentNews } from '../data/newsDates';
import { MarketOverview } from '../components/MarketOverview';
import { NewsFeedSections } from '../components/NewsFeedSections';
import { SectorPerformance } from '../components/SectorPerformance';
import { useGlobalSituation } from '../data/useGlobalSituation';
import { useNewsFeed } from '../data/useNewsFeed';
import { useSiteData } from '../data/useSiteData';
import type { MarketGroup } from '../data/siteSnapshotTypes';
import { PoliticalImpactCard } from '../components/PoliticalImpactCard';
import { isPublishableNews } from '../data/newsAdmission';

export function TodayPage() {
  const { snapshot: newsSnapshot, loading: newsLoading, error: newsError } = useNewsFeed();
  const { market, sectors } = useSiteData();
  const rawSituation = useGlobalSituation();
  const situation = { ...rawSituation, events: rawSituation.events.filter(event => isRecentNews(event.latestSourceAt ?? event.publishedAt)) };
  const [marketTab, setMarketTab] = useState<MarketGroup>('aShare');
  const policies=[...newsSnapshot.latest,...newsSnapshot.continuing,...newsSnapshot.retainedDetails].filter(isPublishableNews).filter(item=>item.editorial?.political);
  const recentEvents = situation.events;
  const featured = [...recentEvents].sort((a, b) => Date.parse(b.latestSourceAt ?? b.publishedAt) - Date.parse(a.latestSourceAt ?? a.publishedAt) || b.relevance.score - a.relevance.score)[0];
  const chain = useMemo(() => featured?.causalChain?.length >= 3 ? {
    nodes: featured.causalChain.slice(0, 6).map(node => ({ title: node.title, detail: node.beginnerExplanation })),
    condition: featured.conditionsThatChangeView?.[0] ?? '这是一条可能路径，事件、政策或供需条件变化都可能让传导失效。',
    evidenceUrl: featured.sources?.[0]?.url,
  } : undefined, [featured]);

  return <main className="page today-page">
    <MarketOverview snapshot={market} activeGroup={marketTab} onGroupChange={setMarketTab} />
    <div className="dashboard-split"><SectorPerformance snapshot={sectors} activeGroup={marketTab} /><CoreTransmission chain={chain} /></div>
    <section aria-labelledby="political-title"><div className="section-heading"><div><p className="eyebrow">政策 · 国际关系 · 地缘冲突</p><h2 id="political-title">政策与地缘传导</h2></div><span>{policies.length} 个事件</span></div>{policies.length ? <div className="political-grid">{policies.slice(0,6).map(item=><PoliticalImpactCard key={item.id} item={{...item.editorial!.political!,event:item.editorial!.item.title,newsId:item.id,publishedAt:item.publishedAt}}/>)}</div> : <p className="empty-state">暂无已读取完整正文并完成中文解读的政策新闻。</p>}</section>
    <NewsFeedSections snapshot={newsSnapshot} loading={newsLoading} error={newsError} showFilters={false} />
  </main>;
}
