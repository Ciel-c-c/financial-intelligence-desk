import { useMemo, useState } from 'react';
import { MarketCard } from '../components/MarketCard';
import { NewsCard } from '../components/NewsCard';
import { SectorCard } from '../components/SectorCard';
import { PoliticalImpactCard } from '../components/PoliticalImpactCard';
import { dataTimestamp, marketGroups, news, politicalImpacts, sectors } from '../data/demoData';
import { filterNews, type RegionFilter } from '../data/selectors';

const regions: RegionFilter[] = ['全部', 'A股', '港股', '美股', '全球'];
const marketTabs = ['A股', '港股', '美股', '全球资产'] as const;

export function TodayPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('全部');
  const [marketTab, setMarketTab] = useState<(typeof marketTabs)[number]>('A股');
  const filtered = useMemo(() => filterNews(news, query, region), [query, region]);
  const headlines = filtered.filter((item) => item.mode === '今日快照').slice(0, 3);
  const stockNews = filtered.filter((item) => item.topic === '市场' || item.topic === '公司');
  const economyNews = filtered.filter((item) => item.topic === '宏观' || item.topic === '经济');

  return (
    <main className="page today-page">
      <section className="market-hero">
        <div className="market-hero-head"><div><p className="eyebrow">全球市场仪表盘</p><h1>{marketTab === 'A股' ? 'A股市场全景' : `${marketTab}概览`}</h1></div><span className="market-status">今日</span></div>
        <div className="market-summary"><strong>指数小涨，个股偏弱</strong><p>上涨 1,778 只、下跌 3,580 只；煤炭与航运领涨，游戏与传媒领跌。</p></div>
        <small>数据截至 {dataTimestamp} · 收盘数据为延迟快照</small>
      </section>

      <section aria-labelledby="market-title">
        <div className="section-heading"><div><p className="eyebrow">主要指数与资产</p><h2 id="market-title">今天涨了还是跌了</h2></div><span>延迟行情</span></div>
        <div className="market-tabs" aria-label="市场切换">{marketTabs.map((item) => <button key={item} type="button" aria-pressed={marketTab === item} onClick={() => setMarketTab(item)}>{item}</button>)}</div>
        <div className="market-grid">{marketGroups[marketTab].map((item) => <MarketCard key={item.id} item={item} />)}</div>
      </section>

      <section aria-labelledby="sector-title">
        <div className="section-heading"><div><p className="eyebrow">领涨与领跌</p><h2 id="sector-title">行业板块涨跌</h2></div><span>{sectors.length} 个板块</span></div>
        <p className="section-intro">先看资金今天去了哪里，再点开“为什么这样走”理解背后的经济逻辑。</p>
        <div className="sector-list">{sectors.map((item) => <SectorCard key={item.id} item={item} />)}</div>
      </section>

      <section className="impact-card" aria-labelledby="impact-title">
        <p className="eyebrow">政治经济 → 股市</p><h2 id="impact-title">今天的影响链</h2>
        <div className="impact-chain"><span>中东冲突升温</span><i>→</i><span>油价上涨</span><i>→</i><span>通胀担忧</span><i>→</i><span>降息更难</span><i>→</i><span>成长股承压</span></div>
        <p>这是一条可能路径，不是确定预测。冲突缓和、供应增加或政策变化都可能改变结果。</p>
      </section>

      <section aria-labelledby="political-title">
        <div className="section-heading"><div><p className="eyebrow">政策 · 国际关系 · 地缘冲突</p><h2 id="political-title">政策与地缘影响</h2></div><span>{politicalImpacts.length} 个事件</span></div>
        <div className="political-grid">{politicalImpacts.map((item) => <PoliticalImpactCard key={item.id} item={item} />)}</div>
      </section>

      <section aria-labelledby="news-title">
        <div className="section-heading"><div><p className="eyebrow">今日资讯</p><h2 id="news-title">搜索与筛选</h2></div><span>{filtered.length} 条</span></div>
        <label className="search-field"><span>搜索资讯</span><input type="search" aria-label="搜索资讯" placeholder="搜索公司、主题或关键词" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="region-filter" aria-label="地区筛选">{regions.map((item) => <button key={item} type="button" aria-pressed={region === item} onClick={() => setRegion(item)}>{item}</button>)}</div>
      </section>

      {headlines.length > 0 && <section aria-labelledby="headline-title"><div className="section-heading"><div><p className="eyebrow">最重要的三件事</p><h2 id="headline-title">今日要闻</h2></div></div><div className="news-list">{headlines.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {stockNews.length > 0 && <section aria-labelledby="stock-news-title"><div className="section-heading"><div><p className="eyebrow">市场与公司</p><h2 id="stock-news-title">股市新闻</h2></div><span>{stockNews.length} 条</span></div><div className="news-list">{stockNews.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {economyNews.length > 0 && <section aria-labelledby="economy-news-title"><div className="section-heading"><div><p className="eyebrow">宏观与政策</p><h2 id="economy-news-title">经济新闻</h2></div><span>{economyNews.length} 条</span></div><div className="news-list">{economyNews.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {filtered.length === 0 && <p className="empty-state">没有找到匹配资讯，换个关键词试试。</p>}
    </main>
  );
}
