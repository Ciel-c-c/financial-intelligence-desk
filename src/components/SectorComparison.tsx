import type { SectorSnapshot } from '../data/types';

export function SectorComparison({ items }: { items: SectorSnapshot[] }) {
  const numericChanges = items.flatMap((item) => item.changePercent === null ? [] : [Math.abs(item.changePercent)]);
  const ceiling = Math.max(1, ...numericChanges);
  return (
    <section className="sector-comparison" aria-label="行业涨跌比较">
      <div className="comparison-head"><div><p className="eyebrow">涨跌幅 · %</p><h3>板块表现一览</h3></div><span><i className="legend-up" /> 上涨 <i className="legend-down" /> 下跌</span></div>
      <div className="comparison-chart">
        {items.map((item) => {
          const rising = item.direction === '领涨' || item.direction === '上涨';
          const width = item.changePercent === null ? 48 : Math.max(8, Math.abs(item.changePercent) / ceiling * 100);
          return <div className="comparison-row" key={item.id}>
            <span title={item.name}>{item.name.replace('开采', '')}</span>
            <div className="comparison-track"><i className={rising ? 'bar-up' : 'bar-down'} style={{ width: `${width}%` }} /></div>
            <strong className={rising ? 'positive' : 'negative'}>{item.changePercent === null ? item.direction : `${rising ? '+' : ''}${item.changePercent.toFixed(2)}%`}</strong>
          </div>;
        })}
      </div>
      <small>有可靠数值时横条表示涨跌幅；仅确认排序时显示“领涨/领跌”，不填造百分比。</small>
    </section>
  );
}
