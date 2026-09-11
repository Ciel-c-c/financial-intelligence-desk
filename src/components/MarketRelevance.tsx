import type { Relevance } from '../data/globalSituationTypes';

const labels = { high:'高', medium:'中', low:'低' } as const;
const filled = { high:5, medium:3, low:2 } as const;

export function MarketRelevance({ relevance, compact = false }: { relevance: Relevance; compact?: boolean }) {
  return <span className={`relevance relevance-${relevance.level}`} aria-label={`市场关联度：${labels[relevance.level]}，评分 ${relevance.score}/11`}>
    {!compact && <b>市场关联度：{labels[relevance.level]}</b>}<span aria-hidden="true">{Array.from({length:5},(_,index) => <i className={index < filled[relevance.level] ? 'filled' : ''} key={index} />)}</span>
  </span>;
}
