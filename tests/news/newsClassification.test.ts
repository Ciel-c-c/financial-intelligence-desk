import {expect,it} from 'vitest';
import {classifyNewsItem} from '../../scripts/news/news-classifier.mjs';
const classify=(title:string)=>classifyNewsItem({originalTitle:title,originalSummary:'',sourceId:'bbc-business',sourceTier:'verified',publishedAt:'2026-10-12T00:00:00Z'});
it('does not turn an unrelated world headline into regulatory or supply-demand news',()=>{
 const r=classify('Town celebrates the opening of a new museum');
 expect(r.analysisLevels).toEqual([]);expect(r.eventTypes).toEqual([]);expect(r.impactChannels).toEqual([]);
});
it('recognizes an IPO company event without claiming a profit or supply change',()=>{
 const r=classify('AI company cancels IPO amid volatility');
 expect(r.analysisLevels).toEqual(['公司']);expect(r.eventTypes).toEqual(['公司经营']);expect(r.impactChannels).toEqual([]);
});
it('labels GDP as macroeconomic data rather than an unspecified industry story',()=>{
 const r=classify('GDP growth slows');expect(r.analysisLevels).toEqual(['宏观']);expect(r.eventTypes).toEqual(['经济数据']);
});
