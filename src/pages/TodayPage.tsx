import { useMemo, useState } from 'react';
import { MarketCard } from '../components/MarketCard';
import { NewsCard } from '../components/NewsCard';
import { dataTimestamp, markets, news } from '../data/demoData';
import { filterNews, type RegionFilter } from '../data/selectors';

const regions: RegionFilter[] = ['全部', 'A股', '港股', '美股', '全球'];

export function TodayPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('全部');
  const filtered = useMemo(() => filterNews(news, query, region), [query, region]);
  const headlines = filtered.filter((item) => item.mode === '今日快照').slice(0, 3);
  const stockNews = filtered.filter((item) => item.topic === '市场' || item.topic === '公司');
  const economyNews = filtered.filter((item) => item.topic === '宏观' || item.topic === '经济');

  return (
    <main className="page today-page">
      <section className="hero">
        <p className="eyebrow">今天需要看懂什么</p>
        <h1>三分钟，理清市场主线</h1>
        <p>把今日股市与经济新闻翻译成小白能理解的因果关系。内容仅供学习，不构成投资建议。</p>
        <small>数据截至 {dataTimestamp}</small>
      </section>

      <section aria-labelledby="market-title">
        <div className="section-heading"><div><p className="eyebrow">市场温度</p><h2 id="market-title">A · 港 · 美概览</h2></div><span>演示</span></div>
        <div className="market-grid">{markets.map((item) => <MarketCard key={item.id} item={item} />)}</div>
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
