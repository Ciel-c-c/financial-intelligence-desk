import {Link} from 'react-router-dom';
import type {LiveNewsItem} from '../data/newsFeedTypes';
import {relatedWorldEvents} from '../data/worldEvents/registry';
import {isPublishableNews,isPublishableSource,isPublishableSummary} from '../data/newsAdmission';
export function RelatedWorldEvents({item}:{item:LiveNewsItem}){
 if(!isPublishableNews(item)&&!isPublishableSummary(item)&&!isPublishableSource(item))return null;
 const related=relatedWorldEvents(item);if(!related.length)return null;
 return <aside className="page related-world-events" aria-label="相关事件背景"><h2>理解相关机制</h2>{related.map(({event,rationale,relation})=><div key={event.id}><Link to={'/events/'+event.id}>{event.question} →</Link><p>{rationale}</p><small>{relation==='topic-context'?'主题背景，非同一事件':'经人工核对的事件关联'} · 历史案例 {event.period.label}</small></div>)}</aside>;
}
