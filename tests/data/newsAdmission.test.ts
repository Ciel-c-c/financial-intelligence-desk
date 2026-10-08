import { webcrypto,createHash } from 'node:crypto';
import { afterEach, expect,it,vi } from 'vitest';
import reviewed from '../fixtures/reviewed-news.json';
import { isPublishableNews,verifyNewsEvidence } from '../../src/data/newsAdmission';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';
const item=reviewed.items[0] as unknown as LiveNewsItem;
it('admits a hash-bound source summary and rejects a changed summary',async()=>{
 vi.stubGlobal('crypto',webcrypto);
 const summary='官方报道提供了事件的具体进展和当前情况，后续影响仍需结合政策落实、需求变化与企业经营数据观察。'.repeat(2);
 const text=item.originalTitle+'\n'+summary,hash=createHash('sha256').update(text).digest('hex');
 const record={...item,originalSummary:summary,article:{...item.article!,status:'summary',text,sha256:hash,reader:'publisher-feed-summary'},editorial:{...item.editorial!,evidenceScope:'summary',sourceBodyHash:hash}} as LiveNewsItem;
 expect(await verifyNewsEvidence(record)).toBe(true);
 expect(await verifyNewsEvidence({...record,originalSummary:'只有标题'})).toBe(false);
});
afterEach(()=>vi.unstubAllGlobals());
it('admits server-read Chinese evidence without requiring republication of its full text',async()=>{
 const url='https://www.cnfin.com/yw-lb/detail/20260915/4470069_1.html';
 const chinese={...item,canonicalUrl:url,article:{...item.article!,text:undefined,reader:'cnfin-body',characterCount:200,sourceUrl:url},editorial:{...item.editorial!,item:{...item.editorial!.item,sourceUrl:url}}} as LiveNewsItem;
 expect(await verifyNewsEvidence(chinese)).toBe(true);
 expect(await verifyNewsEvidence({...chinese,canonicalUrl:'https://unverified.example/article'})).toBe(false);
});
it('admits the audited first-party Chinese media reader but not an unverified domain',async()=>{
 const url='https://www.yicai.com/news/103364397.html';
 const record={...item,canonicalUrl:url,article:{...item.article!,text:undefined,reader:'yicai-body',characterCount:1000,sourceUrl:url},editorial:{...item.editorial!,item:{...item.editorial!.item,sourceUrl:url}}} as LiveNewsItem;
 expect(await verifyNewsEvidence(record)).toBe(true);
});
it('admits a full official body with its corresponding Chinese analysis',async()=>{
 vi.stubGlobal('crypto',webcrypto);
 expect(await verifyNewsEvidence(item)).toBe(true);
});
it('rejects mismatched Chinese headlines and reused interpretation',()=>{
 expect(isPublishableNews({...item,titleZh:'美联储降息'})).toBe(false);
 expect(isPublishableNews({...item,originalTitle:'A different policy announcement'})).toBe(false);
 expect(isPublishableNews({...item,editorial:{...item.editorial!,sourceBodyHash:'0'.repeat(64)}})).toBe(false);
});
it('rejects changed source text even if a complete flag is left behind',async()=>{
 vi.stubGlobal('crypto',webcrypto);
 expect(await verifyNewsEvidence({...item,article:{...item.article!,text:item.article!.text+' Changed facts.'}})).toBe(false);
});
