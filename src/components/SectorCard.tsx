import { Link } from 'react-router-dom';
import type { SectorSnapshot } from '../data/types';

export function SectorCard({ item }: { item: SectorSnapshot }) {
  const rising = item.direction === '领涨' || item.direction === '上涨';
  return (
    <article className="sector-card">
      <div className="sector-main">
        <div><span className={`sector-rank ${rising ? 'up' : 'down'}`}>{item.direction}</span><h3>{item.name}</h3></div>
        <strong className={rising ? 'positive' : 'negative'}>{item.changePercent === null ? (rising ? '涨幅居前' : '跌幅居前') : `${rising ? '+' : ''}${item.changePercent.toFixed(2)}%`}</strong>
      </div>
      <details>
        <summary>为什么这样走</summary>
        <p>{item.reason}</p>
        <div className="beginner-note"><b>小白这样理解</b><span>{item.beginnerNote}</span></div>
        {item.asOf && <small>板块排序截至 {item.asOf}</small>}
        {item.relatedNewsId && <Link to={`/news/${item.relatedNewsId}`}>查看相关事件 →</Link>}
      </details>
    </article>
  );
}
