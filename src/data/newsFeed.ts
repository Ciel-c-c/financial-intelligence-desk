import { newsFeedSeed } from './newsFeedSeed'; import type { LiveNewsItem,NewsFeedSnapshot } from './newsFeedTypes';
import { verifyNewsEvidence } from './newsAdmission';
const valid=(value:any):value is NewsFeedSnapshot=>value?.schemaVersion===1&&['fresh','delayed','source_error'].includes(value.status)&&Array.isArray(value.latest)&&Array.isArray(value.continuing)&&value.continuing.length<=6&&Array.isArray(value.retainedDetails)&&Array.isArray(value.sourceHealth);
export async function loadNewsFeed(fetchImpl:typeof fetch=fetch):Promise<NewsFeedSnapshot>{
 const read=async(path:string)=>{try{const response=await fetchImpl(path,{cache:'no-store'});return response.ok?await response.json():undefined;}catch{return undefined;}};
 const [value,reviewed]=await Promise.all([read('./data/news-feed.json'),read('./data/reviewed-news.json')]);
 const snapshot=valid(value)?value:newsFeedSeed;
 const raw=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails];
 const candidates:LiveNewsItem[]=Array.isArray(reviewed?.items)?reviewed.items:[];
 const approved=await Promise.all(candidates.map(async item=>{
   const current=raw.find(news=>news.canonicalUrl===item.canonicalUrl);
   if(current?.invalidationReason) return undefined;
   if(current?.article&&current.article.sha256!==item.article?.sha256) return undefined;
   const candidate=current?.editorial?current:item;
   return await verifyNewsEvidence(candidate)?candidate:undefined;
 }));
 const validateRaw=async(items:LiveNewsItem[])=>{const checked=await Promise.all(items.map(async item=>!item.editorial||await verifyNewsEvidence(item)?item:undefined));return checked.filter((item):item is LiveNewsItem=>!!item);};
 const [latest,continuing,retained]=await Promise.all([validateRaw(snapshot.latest),validateRaw(snapshot.continuing),validateRaw(snapshot.retainedDetails)]);
 const reviewedItems=approved.filter((item):item is LiveNewsItem=>!!item);
 const now=Date.parse(snapshot.attemptedAt);
 const recent=reviewedItems.filter(item=>{const age=now-Date.parse(item.publishedAt);return age>=0&&age<=86400_000;});
 const recentIds=new Set(recent.map(item=>item.id));
 const retainedDetails=[...reviewedItems.filter(item=>!recentIds.has(item.id)),...retained.filter(item=>!recentIds.has(item.id))];
 const approvedIds=new Set(approved.filter(Boolean).map(item=>item!.id));
 return {...snapshot,latest:[...recent,...latest.filter(item=>!approvedIds.has(item.id))].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)),continuing:continuing.filter(item=>!approvedIds.has(item.id)),retainedDetails:retainedDetails.filter((item,index,list)=>list.findIndex(other=>other.id===item.id)===index)};
}
