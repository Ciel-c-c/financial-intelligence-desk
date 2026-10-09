import { Link } from 'react-router-dom';
import { PreviousGlobalEvents } from '../components/PreviousGlobalEvents';
import { isRecentNews } from '../data/newsDates';
import { FreshnessBanner } from '../components/FreshnessBanner';
import { MarketRelevance } from '../components/MarketRelevance';
import { SituationMap, regionLabel } from '../components/SituationMap';
import { useGlobalSituation } from '../data/useGlobalSituation';
import {useNewsFeed} from '../data/useNewsFeed';
import {presentNews} from '../data/newsPresentation';
import {LiveNewsCard} from '../components/LiveNewsCard';

const themeNames: Record<string,{ title:string; plain:string }> = {
  'energy-security':{title:'能源供应风险',plain:'油、气、电和运输是否稳定'},
  'monetary-policy':{title:'利率路径重估',plain:'借钱会不会更贵、更久'},
  'trade-policy':{title:'贸易摩擦',plain:'关税与限制如何进入成本'},
  'political-transition':{title:'政策不确定性',plain:'承诺能否变成法律和预算'},
  'geopolitical-conflict':{title:'地缘风险偏好',plain:'资金是否更偏向安全资产'},
};

export function GlobalSituationPage() {
  const snapshot = useGlobalSituation();
  const events = snapshot.events.filter(event => isRecentNews(event.latestSourceAt ?? event.publishedAt));
  const {snapshot:news}=useNewsFeed();
  const factual=news.latest.filter(item=>isRecentNews(item.publishedAt)&&presentNews(item)&&!events.some(event=>event.id===item.id));
  const oldSummaries=[...news.latest,...news.continuing,...news.retainedDetails].filter(item=>presentNews(item)?.kind==='summary'&&!isRecentNews(item.publishedAt)&&Date.parse(item.publishedAt)<=Date.now());
  const featured = [...events].sort((a,b) => b.relevance.score - a.relevance.score)[0];
  const themes = Object.entries(themeNames).map(([id,value]) => ({...value,count:events.filter(event => event.eventType === id).length})).filter(theme => theme.count > 0);
  const watchItems = events.flatMap(event => event.watchConditions ?? event.conditionsThatChangeView ?? []).filter((item,index,list) => list.indexOf(item) === index).slice(0,5);
  return <main className="page situation-page">
    <header className="situation-hero" style={{ backgroundImage:'linear-gradient(90deg,rgba(41,52,88,.94),rgba(69,64,106,.8)),url("./earth-horizon-bg.png")' }}>
      <div><p className="eyebrow">GLOBAL SITUATION / MACRO &amp; GEOPOLITICAL RISK</p><h1>今天，全球有哪些事情正在影响你的钱？</h1><p>把世界新闻翻译成增长、通胀、利率、汇率、商品、行业与企业盈利的传导路径。</p></div>
      <div className="hero-lens" aria-hidden="true"><span>事件</span><i>→</i><span>机制</span><i>→</i><span>资产</span></div>
    </header>
    <FreshnessBanner snapshot={snapshot} />
    {featured ? <section className="featured-situation" aria-labelledby="featured-title">
      <div className="section-heading"><div><p className="eyebrow">PRIORITY ONE</p><h2 id="featured-title">今天最重要的一件事</h2></div><MarketRelevance relevance={featured.relevance} /></div>
      <div className="featured-grid"><div><span className="evidence-tag fact-tag">FACT｜事实</span><h3>{featured.headline}</h3><p>{featured.oneLine}</p><Link className="primary-link" to={`/situation/${featured.id}`}>打开金融透镜 →</Link></div><ol aria-label="核心影响路径">{featured.causalChain.slice(0,4).map((node,index) => <li key={node.id}><small>{index ? '可能 →' : '发生'}</small><strong>{node.title}</strong></li>)}</ol></div>
      <div className="featured-assets"><b>重点观察</b>{featured.relatedAssets.slice(0,5).map(asset => <span key={asset.name}>{asset.symbol} {asset.name}</span>)}</div>
    </section> : <p className="empty-state">当前暂无已完成聚合解读的政策与地缘事件，其他已发布内容见下方。</p>}
    <SituationMap events={events} />
    <section className="situation-events" aria-labelledby="events-title"><div className="section-heading"><div><p className="eyebrow">FILTERED BY FINANCIAL IMPACT</p><h2 id="events-title">重要事件</h2></div><span>{events.length+factual.length} 个事件</span></div><div className="situation-event-grid">{events.slice(0,6).map(event => <article key={event.id}><div><span className="event-region">{regionLabel(event.region)}</span><MarketRelevance compact relevance={event.relevance} /></div><h3>{event.headline}</h3><p>{event.oneLine}</p><small>{event.sources.length} 个来源 · {event.relatedAssets.length} 类敏感资产</small><Link to={`/situation/${event.id}`}>查看机制与条件 →</Link></article>)}{factual.slice(0,Math.max(0,6-events.length)).map(item=><LiveNewsCard key={item.id} item={item}/>)}</div></section>
    <div className="situation-lower-grid">
      <section className="trading-themes"><p className="eyebrow">WHAT MARKETS ARE TRADING</p><h2>市场正在交易什么</h2><div>{themes.map(theme => <article key={theme.title}><span>{String(theme.count).padStart(2,'0')}</span><h3>{theme.title} {theme.count > 1 ? '↑' : '→'}</h3><p>{theme.plain}</p></article>)}</div><p className="condition-note">这些是市场正在关注的变量，不是资产涨跌预测。每个判断都要继续检查事件是否持续、是否已被定价。</p></section>
      <section className="next-watch"><p className="eyebrow">NEXT CATALYSTS</p><h2>接下来关注什么</h2>{watchItems.length ? <ul>{watchItems.map(item => <li key={item}><span>{item}</span></li>)}</ul> : <p className="empty-state">当前快照没有足够证据列出新的观察条件。</p>}</section>
    </div>
    <PreviousGlobalEvents events={snapshot.events.filter(event => !isRecentNews(event.latestSourceAt ?? event.publishedAt))} open={!events.length}/>
    {oldSummaries.length>0&&<details className="watch-card" open={!events.length&&!factual.length}><summary><h2>此前来源总结 / 背景参考</h2></summary><p>这些报道保留原发布日期，不作为今日重点。</p><div className="news-list">{oldSummaries.slice(0,10).map(item=><LiveNewsCard key={item.id} item={item}/>)}</div></details>}
  </main>;
}
