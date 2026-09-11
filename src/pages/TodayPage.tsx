import { useMemo, useState } from 'react';
import { MarketCard } from '../components/MarketCard';
import { NewsCard } from '../components/NewsCard';
import { SectorCard } from '../components/SectorCard';
import { PoliticalImpactCard } from '../components/PoliticalImpactCard';
import { SectorComparison } from '../components/SectorComparison';
import { marketGroups, news, politicalImpacts, sectors } from '../data/demoData';
import { filterNews, type RegionFilter } from '../data/selectors';

const regions: RegionFilter[] = ['全部', 'A股', '港股', '美股', '全球'];
const marketTabs = ['A股', '港股', '美股', '全球资产'] as const;
const transmissionSteps = [
  { title: '中东冲突升温', detail: '供应与运输风险溢价上升。' },
  { title: '油价上涨', detail: '能源成本向生产和运输环节传导。' },
  { title: '通胀担忧', detail: '市场重新评估物价回落的速度。' },
  { title: '降息更难', detail: '利率可能在更高水平维持更久。' },
  { title: '成长股承压', detail: '较高贴现率压低远期盈利估值。' },
] as const;

export function TodayPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('全部');
  const [marketTab, setMarketTab] = useState<(typeof marketTabs)[number]>('A股');
  const [openTransmissionStep, setOpenTransmissionStep] = useState<number | null>(null);
  const filtered = useMemo(() => filterNews(news, query, region), [query, region]);
  const headlines = filtered.filter((item) => item.mode === '今日快照').slice(0, 3);
  const stockNews = filtered.filter((item) => item.topic === '市场' || item.topic === '公司');
  const economyNews = filtered.filter((item) => item.topic === '宏观' || item.topic === '经济');

  return (
    <main className="page today-page">
      <section className="market-hero">
        <div className="market-hero-head"><div><p className="eyebrow">MARKET OVERVIEW / 市场总览</p><h1>{marketTab === 'A股' ? 'A股市场全景' : `${marketTab}概览`}</h1></div><span className="market-status">今日</span></div>
        <div className="market-summary"><strong>A股午后回升，三大指数仍收跌</strong><p>沪指、深成指跌超 1%；元件、通信和电力相对强，金融与贵金属承压。</p></div>
        <small>数据截至 {marketGroups[marketTab][0].timestamp} · 收盘数据为延迟快照</small>
      </section>

      <section aria-labelledby="market-title">
        <div className="section-heading"><div><p className="eyebrow">主要指数与资产</p><h2 id="market-title">大类资产表现</h2></div><span>延迟行情</span></div>
        <div className="market-tabs" aria-label="市场切换">{marketTabs.map((item) => <button key={item} type="button" aria-pressed={marketTab === item} onClick={() => setMarketTab(item)}>{item}</button>)}</div>
        <div className="market-grid">{marketGroups[marketTab].map((item) => <MarketCard key={item.id} item={item} />)}</div>
      </section>

      <div className="dashboard-split">
      <section aria-labelledby="sector-title" className="dashboard-panel">
        <div className="section-heading"><div><p className="eyebrow">领涨与领跌</p><h2 id="sector-title">行业相对强弱</h2></div><span>{sectors.length} 个板块</span></div>
        <p className="section-intro">先看资金今天去了哪里，再点开“为什么这样走”理解背后的经济逻辑。</p>
        <SectorComparison items={sectors} />
        <div className="sector-list">{sectors.map((item) => <SectorCard key={item.id} item={item} />)}</div>
      </section>

      <section className="impact-card dashboard-panel" aria-labelledby="impact-title">
        <p className="eyebrow">政治经济 → 资产价格</p><h2 id="impact-title">核心市场传导</h2>
        <ol className="impact-chain" aria-label="宏观传导路径">{transmissionSteps.map((step, index) => {
          const expanded = openTransmissionStep === index;
          return <li key={step.title}><button type="button" aria-expanded={expanded} onClick={() => setOpenTransmissionStep(expanded ? null : index)}><span>{step.title}</span><b aria-hidden="true">{index < transmissionSteps.length - 1 ? '↓' : '•'}</b></button>{expanded && <p>{step.detail}</p>}</li>;
        })}</ol>
        <p>这是一条可能路径，不是确定预测。冲突缓和、供应增加或政策变化都可能改变结果。</p>
      </section>
      </div>

      <section aria-labelledby="political-title">
        <div className="section-heading"><div><p className="eyebrow">政策 · 国际关系 · 地缘冲突</p><h2 id="political-title">政策与地缘传导</h2></div><span>{politicalImpacts.length} 个事件</span></div>
        <div className="political-grid">{politicalImpacts.map((item) => <PoliticalImpactCard key={item.id} item={item} />)}</div>
      </section>

      <section aria-labelledby="news-title">
        <div className="section-heading"><div><p className="eyebrow">今日资讯</p><h2 id="news-title">市场资讯检索</h2></div><span>{filtered.length} 条</span></div>
        <label className="search-field"><span>搜索资讯</span><input type="search" aria-label="搜索资讯" placeholder="搜索公司、主题或关键词" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="region-filter" aria-label="地区筛选">{regions.map((item) => <button key={item} type="button" aria-pressed={region === item} onClick={() => setRegion(item)}>{item}</button>)}</div>
      </section>

      {headlines.length > 0 && <section aria-labelledby="headline-title"><div className="section-heading"><div><p className="eyebrow">最重要的三件事</p><h2 id="headline-title">核心事件</h2></div></div><div className="news-list">{headlines.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {stockNews.length > 0 && <section aria-labelledby="stock-news-title"><div className="section-heading"><div><p className="eyebrow">市场与公司</p><h2 id="stock-news-title">市场与公司动态</h2></div><span>{stockNews.length} 条</span></div><div className="news-list">{stockNews.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {economyNews.length > 0 && <section aria-labelledby="economy-news-title"><div className="section-heading"><div><p className="eyebrow">宏观与政策</p><h2 id="economy-news-title">宏观经济动态</h2></div><span>{economyNews.length} 条</span></div><div className="news-list">{economyNews.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
      {filtered.length === 0 && <p className="empty-state">没有找到匹配资讯，换个关键词试试。</p>}
    </main>
  );
}
