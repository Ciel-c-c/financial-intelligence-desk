import type { MarketGroup, MarketOverviewSnapshot } from '../data/siteSnapshotTypes';

const groupLabels: Record<MarketGroup, string> = { aShare: 'A股', hongKong: '港股', us: '美股', globalAssets: '全球资产' };
const stateLabels = { trading: '交易中', delayed: '延迟行情', close: '当日收盘', previous_close: '上一交易日收盘' };
const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '暂无';

export function MarketOverview({ snapshot, activeGroup, onGroupChange }: { snapshot?: MarketOverviewSnapshot; activeGroup: MarketGroup; onGroupChange: (group: MarketGroup) => void }) {
  const items = snapshot?.groups[activeGroup] ?? [];
  const health = snapshot?.groupHealth[activeGroup];
  const groupDataAsOf = items.map(item => item.dataAsOf).sort().at(-1);
  const up = items.filter(item => (item.changePercent ?? 0) > 0).length;
  const down = items.filter(item => (item.changePercent ?? 0) < 0).length;
  return <>
    <section className="market-hero"><div className="market-hero-head"><div><p className="eyebrow">MARKET OVERVIEW / 市场总览</p><h1>{groupLabels[activeGroup]}概览</h1></div><span className="market-status">{health?.status === 'unavailable' ? '暂无数据' : items.length ? stateLabels[items[0].marketState] : '等待数据'}</span></div><div className="market-summary"><strong>{items.length ? `${items.length} 个观察项，${up} 个上涨、${down} 个下跌` : '暂无可靠市场数据'}</strong><p>{items.length ? '以下只描述已验证数据；没有可靠证据时不推断涨跌原因。' : health?.fallbackReason ?? '数据源尚未通过验证或本轮获取失败。'}</p></div><small>数据截至 {formatTime(groupDataAsOf)} · 状态：{health?.status ?? 'unavailable'}</small></section>
    <section aria-labelledby="market-title"><div className="section-heading"><div><p className="eyebrow">主要指数与资产</p><h2 id="market-title">大类资产表现</h2></div><span>{health?.status ?? 'unavailable'}</span></div><div className="market-tabs" aria-label="市场切换">{(Object.keys(groupLabels) as MarketGroup[]).map(group => <button key={group} type="button" aria-pressed={activeGroup === group} onClick={() => onGroupChange(group)}>{groupLabels[group]}</button>)}</div>{items.length ? <div className="market-grid">{items.map(item => { const rising = (item.changePercent ?? 0) >= 0; return <article className="market-card" key={item.id}><div className="card-row"><span className="eyebrow">{item.symbol}</span><small>{stateLabels[item.marketState]}</small></div><div className="market-card-body"><div className="market-quote"><h3>{item.name}</h3><strong>{item.value.toLocaleString('zh-CN')}</strong><p className={`market-change ${rising ? 'positive' : 'negative'}`}>{rising ? '↑ 上涨' : '↓ 下跌'} {item.changePercent === undefined ? '—' : `${Math.abs(item.changePercent).toFixed(2)}%`}</p></div></div><small>数据时间：{formatTime(item.dataAsOf)}<br />来源：<a href={item.source.url} target="_blank" rel="noreferrer">{item.source.name}</a></small></article>; })}</div> : <p className="empty-state">{health?.fallbackReason ?? '暂无可靠数据，不使用演示值补位。'}</p>}</section>
  </>;
}
