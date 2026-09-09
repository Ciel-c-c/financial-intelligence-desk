import { Link } from 'react-router-dom';
import type { SectorSnapshot } from '../data/types';

export function SectorCard({ item }: { item: SectorSnapshot }) {
  const rising = item.changePercent >= 0;
  return (
    <article className="sector-card">
      <div className="sector-main">
        <div><span className={`sector-rank ${rising ? 'up' : 'down'}`}>{item.direction}</span><h3>{item.name}</h3></div>
        <strong className={rising ? 'positive' : 'negative'}>{rising ? '+' : ''}{item.changePercent.toFixed(2)}%</strong>
      </div>
      <details>
        <summary>为什么这样走</summary>
        <p>{item.reason}</p>
        <div className="beginner-note"><b>小白这样理解</b><span>{item.beginnerNote}</span></div>
        {item.relatedNewsId && <Link to={`/news/${item.relatedNewsId}`}>查看相关事件 →</Link>}
      </details>
    </article>
  );
}
