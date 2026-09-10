import type { SectorSnapshot } from '../data/types';

export function SectorComparison({ items }: { items: SectorSnapshot[] }) {
  const ceiling = Math.max(...items.map((item) => Math.abs(item.changePercent)));
  return (
    <section className="sector-comparison" aria-label="行业涨跌比较">
      <div className="comparison-head"><div><p className="eyebrow">涨跌幅 · %</p><h3>板块表现一览</h3></div><span><i className="legend-up" /> 上涨 <i className="legend-down" /> 下跌</span></div>
      <div className="comparison-chart">
        {items.map((item) => {
          const rising = item.changePercent >= 0;
          return <div className="comparison-row" key={item.id}>
            <span title={item.name}>{item.name.replace('开采', '')}</span>
            <div className="comparison-track"><i className={rising ? 'bar-up' : 'bar-down'} style={{ width: `${Math.max(8, Math.abs(item.changePercent) / ceiling * 100)}%` }} /></div>
            <strong className={rising ? 'positive' : 'negative'}>{rising ? '+' : ''}{item.changePercent.toFixed(2)}%</strong>
          </div>;
        })}
      </div>
      <small>横条长度表示涨跌幅绝对值；颜色同时配合正负号，避免只依赖颜色判断。</small>
    </section>
  );
}
