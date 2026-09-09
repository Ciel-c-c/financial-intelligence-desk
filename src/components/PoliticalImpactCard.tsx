import { Link } from 'react-router-dom';
import type { PoliticalImpact } from '../data/types';

export function PoliticalImpactCard({ item }: { item: PoliticalImpact }) {
  return (
    <article className="political-card">
      <header><span>{item.type}</span><b>{item.status}</b></header>
      <h3>{item.event}</h3>
      <dl>
        <div><dt>传导渠道</dt><dd>{item.channel}</dd></div>
        <div><dt>受影响板块</dt><dd className="asset-tags">{item.affected.map((asset) => <span key={asset}>{asset}</span>)}</dd></div>
        <div><dt>接下来观察</dt><dd>{item.watch}</dd></div>
        <div><dt>反向风险</dt><dd>{item.counterRisk}</dd></div>
      </dl>
      {item.newsId && <Link to={`/news/${item.newsId}`}>查看事件完整解读 →</Link>}
    </article>
  );
}
