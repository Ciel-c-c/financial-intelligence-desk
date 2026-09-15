import { useState } from 'react';
import type { MarketGroup, SectorPerformanceSnapshot } from '../data/siteSnapshotTypes';

export function SectorPerformance({ snapshot, activeGroup }: { snapshot?: SectorPerformanceSnapshot; activeGroup: MarketGroup }) {
  const [expanded, setExpanded] = useState(false);
  const items = snapshot?.groups[activeGroup] ?? [];
  const visible = expanded ? items : [...items.slice(0, 5), ...items.slice(-5)].filter((item, index, list) => list.findIndex(other => other.id === item.id) === index);
  return <section aria-labelledby="sector-title" className="dashboard-panel"><div className="section-heading"><div><p className="eyebrow">领涨与领跌</p><h2 id="sector-title">行业相对强弱</h2></div><span>{items.length} 个板块</span></div>{visible.length ? <div className="sector-list">{visible.map(item => <article className="sector-card" key={item.id}><div className="sector-main"><div><span className={`sector-rank ${item.changePercent >= 0 ? 'up' : 'down'}`}>#{item.rank}</span><h3>{item.name}</h3></div><strong className={item.changePercent >= 0 ? 'positive' : 'negative'}>{item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%</strong></div><small>{item.classification} · 数据时间 {new Date(item.dataAsOf).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })} · <a href={item.source.url}>{item.source.name}</a></small>{item.driver ? <details><summary>为什么这样走</summary><p>{item.driver.summary}</p></details> : <p className="condition-note">暂无足够证据解释本次波动。</p>}</article>)}</div> : <p className="empty-state">{snapshot?.fallbackReason ?? '暂无经过验证的行业表现数据。'}</p>}{items.length > 10 && <button className="secondary-action" type="button" onClick={() => setExpanded(value => !value)}>{expanded ? '收起' : '查看全部行业'}</button>}</section>;
}
