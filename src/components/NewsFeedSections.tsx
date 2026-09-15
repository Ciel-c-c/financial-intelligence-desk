import { useMemo, useState } from 'react';
import { filterLiveNews, type LiveNewsFilters } from '../data/selectors';
import { isRecentNews } from '../data/newsDates';
import type { NewsFeedSnapshot } from '../data/newsFeedTypes';
import { LiveNewsCard } from './LiveNewsCard';
import { NewsFeedStatus } from './NewsFeedStatus';
import { NewsFilters } from './NewsFilters';
import { isPublishableNews } from '../data/newsAdmission';

export function NewsFeedSections({snapshot,loading,error,showFilters=true}:{snapshot:NewsFeedSnapshot;loading:boolean;error?:string;showFilters?:boolean}) {
  const [filters,setFilters] = useState<LiveNewsFilters>({query:'',region:'全部',level:'全部',eventType:'全部'});
  const all = useMemo(() => [...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].filter((item,index,list) => list.findIndex(candidate => candidate.id === item.id) === index),[snapshot]);
  const publishable=all.filter(isPublishableNews);
  const filtered = filterLiveNews(publishable,filters);
  const latest = filtered.filter(item => isRecentNews(item.publishedAt));
  const background = filtered.filter(item => Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) <= Date.now() && !isRecentNews(item.publishedAt)).sort((a,b) => Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  const highlights = latest.slice(0,8), more = latest.slice(8);
  if (loading) return <p className="empty-state">正在加载最新新闻…</p>;
  return <section className="live-news-feed"><NewsFeedStatus snapshot={{...snapshot,latest:publishable.filter(item=>isRecentNews(item.publishedAt))}}/>{error && <p className="empty-state">{error}</p>}{showFilters && <NewsFilters value={filters} onChange={setFilters}/>}
    {latest.length ? <><div className="section-heading"><div><p className="eyebrow">最近 24 小时</p><h2>正在发生</h2></div><span>{highlights.length} 条重点</span></div><div className="news-list">{highlights.map(item => <LiveNewsCard key={item.id} item={item}/>)}</div><div className="section-heading"><div><p className="eyebrow">可靠来源 · 滚动更新</p><h2>全部新闻</h2></div><span>{latest.length} 条</span></div>{more.length ? <div className="news-list">{more.map(item => <LiveNewsCard key={item.id} item={item}/>)}</div> : <p className="section-intro">当前 24 小时新闻已全部列在上方。</p>}</> : <p className="empty-state">当前筛选下暂无近 24 小时新闻。此前报道保留如下，不作为今日重点。</p>}
    {background.length > 0 && <details className="watch-card" open={latest.length === 0}><summary><h2>此前报道 / 背景参考</h2></summary><p>这些新闻发表于 24 小时以前，不代表今天有新进展。请以每条新闻的发布日期为准。</p><div className="news-list">{background.slice(0,20).map(item => <LiveNewsCard key={item.id} item={item}/>)}</div></details>}
  </section>;
}
