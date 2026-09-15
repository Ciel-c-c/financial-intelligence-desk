import {expect,it} from 'vitest';
import {globalEventFromNews} from '../../src/data/globalFromNews';
import {reviewChineseArticle} from '../../scripts/news/chinese-editorial.mjs';
import {articleHash,toPublicEvidence} from '../../scripts/news/full-article.mjs';
import {reviewedItem} from '../fixtures/reviewedFeed';
const text='粮农组织采访谈及霍尔木兹海峡运输与化肥，施肥窗口影响粮食产量。'.repeat(10);
it('keeps geopolitical facts, interpretation and all causal nodes from the same reviewed body',()=>{
 const originalTitle='粮农组织：霍尔木兹海峡航运受阻影响全球粮食生产';
 const url='https://www.cnfin.com/yw-lb/detail/20260915/4469968_1.html';
 const record:any=toPublicEvidence(reviewChineseArticle({...reviewedItem,originalTitle,originalLanguage:'zh',canonicalUrl:url,article:{...reviewedItem.article,sourceUrl:url,text,reader:'cnfin-body',characterCount:text.length,sha256:articleHash(text)}}));
 const event=globalEventFromNews(record)!;
 expect(event.region).toBe('global');
 expect(event.eventType).toBe('geopolitical-conflict');
 expect(event.fact).toEqual(record.editorial.item.facts);
 expect(event.marketView).toEqual(record.editorial.item.consensus);
 expect(event.impactChain?.map(node=>node.title)).toEqual(['海峡运输受阻','化肥可能延迟','错过施肥窗口','粮食供给可能减少']);
 expect(event.sources[0].url).toBe(url);
});
