import { Link } from 'react-router-dom';
import type { GlobalEvent } from '../data/globalSituationTypes';

export function PreviousGlobalEvents({events,open=false}:{events:GlobalEvent[];open?:boolean}) {
  if (!events.length) return null;
  const time = (value:string) => new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
  return <details className="watch-card" open={open}><summary><h2>此前报道 / 背景参考</h2></summary><p>以下为已保存的历史报道，不作为今日重点，也不表示局势仍按原先方向发展。</p><div className="political-grid">{events.slice(0,12).map(event => <article className="political-card" key={event.id}><span className="eyebrow">此前报道 · {event.region}</span><h3><Link to={`/situation/${event.id}`}>{event.headline}</Link></h3><p>{event.summary}</p><small>新闻发布：{time(event.firstPublishedAt ?? event.publishedAt)}<br/>最新来源：{time(event.latestSourceAt ?? event.publishedAt)}</small></article>)}</div></details>;
}
