import {economicNewsPriority} from '../../scripts/news/news-priority.mjs';
export const publisherFamily=item=>(item.sourceName??item.sourceId??'unknown').split('·')[0].trim().toLowerCase();
/** Discovery ordering only: retain every item, and cap a publisher at two of eight highlights while alternatives exist. */
export function orderDiverseNews(items,now=new Date().toISOString()){
 const time=Date.parse(now),counts=new Map(),remaining=[...items],result=[];
 const score=item=>2*economicNewsPriority(item)+(item.importanceScore??0)+Math.max(0,24-Math.max(0,(time-Date.parse(item.publishedAt))/3600000));
 const compare=(a,b)=>score(b)-score(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||String(a.id??a.canonicalUrl).localeCompare(String(b.id??b.canonicalUrl));
 remaining.sort(compare);
 while(remaining.length){
  let eligible=remaining;
  if(result.length<8){const alternatives=remaining.filter(item=>(counts.get(publisherFamily(item))??0)<2);if(alternatives.length)eligible=alternatives;}
  const next=[...eligible].sort((a,b)=>(score(b)-(counts.get(publisherFamily(b))??0)*35)-(score(a)-(counts.get(publisherFamily(a))??0)*35)||compare(a,b))[0];
  result.push(next);remaining.splice(remaining.indexOf(next),1);const family=publisherFamily(next);counts.set(family,(counts.get(family)??0)+1);
 }
 return result;
}
