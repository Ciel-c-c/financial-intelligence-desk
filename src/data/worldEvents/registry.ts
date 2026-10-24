import raw from './events.json';
import type {WorldEvent} from './types';
import type {LiveNewsItem} from '../newsFeedTypes';
import {validateWorldEvent,isClaimAvailable} from './validation';
// Isolate invalid curated content; it must never break the automatic news feed.
export const worldEvents:WorldEvent[]=(raw as WorldEvent[]).filter(event=>{try{return validateWorldEvent(event).length===0;}catch{return false;}});
export function findWorldEvent(id:string){return worldEvents.find(e=>e.id===id);}
export function relatedWorldEvents(news:Pick<LiveNewsItem,'canonicalUrl'|'article'|'invalidationReason'>,events:WorldEvent[]=worldEvents):{event:WorldEvent;rationale:string;relation:string}[]{
 if(news.invalidationReason||!news.article?.sha256)return [];
 return events.flatMap(event=>{
  const link=event.newsLinks.find(l=>l.canonicalUrl===news.canonicalUrl&&l.expectedSourceHash!==null&&l.expectedSourceHash===news.article!.sha256&&event.evidence.find(e=>e.id===l.evidenceId)?.state==='active');
  return link&&event.claims.some(c=>c.kind==='fact'&&isClaimAvailable(event,c))?[{event,rationale:link.rationale,relation:link.relation}]:[];
 });
}
