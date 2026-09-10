import type { MarketSnapshot } from '../data/types';

export function MarketCard({ item }: { item: MarketSnapshot }) {
  const rising = item.changePercent >= 0;
  return (
    <article className="market-card">
      <div className="card-row"><span className="eyebrow">{item.market}</span><span className="status">{item.status}</span></div>
      <h3>{item.indexName}</h3>
      <strong>{item.value}</strong>
      <p className={rising ? 'positive' : 'negative'}>{rising ? '+' : ''}{item.changePercent.toFixed(2)}% · {rising ? '上涨' : '下跌'}</p>
      <div className="market-spark" aria-hidden="true"><i className={rising ? 'spark-up' : 'spark-down'} /></div>
      <small>{item.delayed ? '延迟' : '实时'} · {item.mode}</small>
    </article>
  );
}
