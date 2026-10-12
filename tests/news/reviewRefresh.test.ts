import { expect,it } from 'vitest';
import { refreshReviewedNews } from '../../scripts/news/reviewed-news.mjs';
import { buildNewsSnapshot } from '../../scripts/news/update-news-feed.mjs';
import reviewed from '../fixtures/reviewed-news.json';
import {articleHash} from '../../scripts/news/full-article.mjs';
const hash='a'.repeat(64);
const item={id:'review',sourceId:'cnfin',originalTitle:'已核验报道',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470116_1.html',article:{status:'complete',reader:'cnfin-body',characterCount:458,sha256:hash,sourceUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470116_1.html',checkedAt:'2026-09-15T08:00:00Z'},editorial:{sourceBodyHash:hash}};
it('restores a dynamic pending body omitted from public snapshots without exceeding two extra reads',async()=>{
 const now='2026-10-12T08:00:00Z',body='这是一篇完整的官方财经报道，说明事件事实与相关背景。'.repeat(8);
 const records=Array.from({length:4},(_,i)=>({...item,id:'pending-'+i,sourceTier:'verified',publishedAt:now,canonicalUrl:`https://www.cnfin.com/yw-lb/detail/20261012/${4479348+i}_1.html`,article:{...item.article,sha256:articleHash(body)},editorial:{sourceBodyHash:articleHash(body)}}));
 const calls:string[]=[];
 const result=await refreshReviewedNews(now,async url=>{calls.push(url);return {ok:true,url,text:async()=>`<h1>已核验报道</h1><div class="xhcj_detail_main"><p>${body}</p><p class="app-statement">声明</p>`};},[],{retainBody:true,pending:{latest:records},sourceResults:[]});
 expect(calls).toHaveLength(2);expect(result).toHaveLength(2);expect(result[0].article.text).toBe(body);expect(result[0].publishedAt).toBe(now);
});
it('does not refetch a pending body already supplied by this run or a disabled source',async()=>{
 const now='2026-10-12T08:00:00Z',pending={...item,sourceTier:'verified',publishedAt:now};let calls=0;
 const result=await refreshReviewedNews(now,async()=>{calls++;throw Error('should not fetch');},[],{retainBody:true,pending:{latest:[pending,{...pending,id:'disabled',sourceId:'ths'}]},sourceResults:[{ok:true,items:[{...pending,article:{...pending.article,text:'already fetched'}}]}]});
 expect(calls).toBe(0);expect(result).toEqual([]);
});
it('retains dated reviewed evidence without crashing when copyrighted text is not stored and a source fails',async()=>{
 const result=await refreshReviewedNews('2026-09-15T13:00:00Z',async()=>{throw Error('offline');},[item]);
 expect(result).toEqual([item]);
 expect(result[0].article.text).toBeUndefined();
});
it('rejects an interpretation detached from its body hash',async()=>{
 const result=await refreshReviewedNews('2026-09-15T13:00:00Z',async()=>{throw Error('offline');},[{...item,editorial:{sourceBodyHash:'b'.repeat(64)}}]);
 expect(result).toEqual([]);
});
it.each(['<h1>Different event</h1><p>Changed news</p>','<h1>已核验报道</h1><div>正文已撤下</div>'])('withdraws cached analysis after a confirmed successful response no longer matches the body',async html=>{
 const result=await refreshReviewedNews('2026-09-15T13:00:00Z',async url=>({ok:true,status:200,url,text:async()=>html}),[item]);
 expect(result[0].editorial).toBeUndefined();
 expect(result[0].article.status).toBe('unreadable');
});
it('honors direct-article invalidation even when every index/feed fails',async()=>{
 const previousItem=reviewed.items[0];
 const previous={schemaVersion:1,attemptedAt:'2026-09-15T12:00:00Z',lastSuccessfulAt:'2026-09-15T12:00:00Z',status:'fresh',latest:[],continuing:[],retainedDetails:[previousItem],sourceHealth:[]};
 const invalidated={...previousItem,article:{...previousItem.article,sha256:'0'.repeat(64),status:'unreadable'},editorial:undefined};
 const result=await buildNewsSnapshot({now:'2026-09-15T13:00:00Z',sourceResults:[{id:'ecb',name:'ECB',ok:false,items:[]}],previous,reviewedNews:[invalidated]});
 expect(result.retainedDetails[0].editorial).toBeUndefined();
 expect(result.lastSuccessfulAt).toBe('2026-09-15T12:00:00Z');
 expect(result.status).toBe('source_error');
});
