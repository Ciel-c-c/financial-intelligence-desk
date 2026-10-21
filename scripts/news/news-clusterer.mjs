import {publisherFamily} from '../../src/data/newsDiversity.mjs';
const title=item=>item.originalTitle.toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u4e00-\u9fff]+/g,' ').trim();
const stop=new Set('a an and the as to of in for with on at by per its reports reported announces says'.split(' '));
function sameEvent(a,b){
 if(Math.abs(Date.parse(a.publishedAt)-Date.parse(b.publishedAt))>12*3600000)return false;
 if(a.canonicalUrl===b.canonicalUrl||title(a)===title(b))return true;
 const numbers=s=>s.match(/\d+(?:[.,]\d+)*(?:%|％)?/g)?.sort().join('|')??'';
 if(numbers(a.originalTitle)!==numbers(b.originalTitle))return false;
 const words=item=>new Set(title(item).split(' ').filter(w=>w.length>1&&!stop.has(w)));
 const x=words(a),y=words(b),intersection=[...x].filter(w=>y.has(w)).length;
 // Deliberately conservative. Different-language or substantially rewritten headlines stay separate.
 const benign=new Set(['new','latest','update','updates','according']);
 const differences=[...x].filter(w=>!y.has(w)).concat([...y].filter(w=>!x.has(w)));
 return intersection>=6&&intersection/new Set([...x,...y]).size>=0.86&&differences.every(w=>benign.has(w));
}
export function clusterNewsItems(items){
 const groups=[];
 for(const item of items){const group=groups.find(g=>g.every(member=>sameEvent(member,item)));if(group)group.push(item);else groups.push([item]);}
 return groups.map(group=>{
  const evidence=item=>item.article?.status==='complete'?2:(item.originalSummary?.length??0)>=80&&item.originalSummary!==item.originalTitle?1:0;
  const sorted=[...group].sort((a,b)=>evidence(b)-evidence(a)||Number(b.sourceTier==='official')-Number(a.sourceTier==='official')||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id));
  const primary=sorted[0],links=[...(primary.relatedSources??[]),...sorted.slice(1).flatMap(item=>[{name:item.sourceName,url:item.canonicalUrl,publishedAt:item.publishedAt},...(item.relatedSources??[])])];
  const relatedSources=links.filter((link,index)=>link.url!==primary.canonicalUrl&&links.findIndex(other=>other.url===link.url)===index);
  return {...primary,relatedSources,verificationStatus:new Set(group.map(publisherFamily)).size>1?'cross-checked':primary.verificationStatus};
 });
}
