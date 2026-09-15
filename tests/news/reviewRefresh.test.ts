import { expect,it } from 'vitest';
import { refreshReviewedNews } from '../../scripts/news/reviewed-news.mjs';
import { buildNewsSnapshot } from '../../scripts/news/update-news-feed.mjs';
import reviewed from '../fixtures/reviewed-news.json';
const hash='a'.repeat(64);
const item={id:'review',sourceId:'cnfin',originalTitle:'已核验报道',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470116_1.html',article:{status:'complete',reader:'cnfin-body',characterCount:458,sha256:hash,sourceUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470116_1.html',checkedAt:'2026-09-15T08:00:00Z'},editorial:{sourceBodyHash:hash}};
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
