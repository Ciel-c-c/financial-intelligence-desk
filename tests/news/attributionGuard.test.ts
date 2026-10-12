import {expect,it} from 'vitest';
import record from '../fixtures/unsupported-attribution-news.json';
import {isPublishableNews} from '../../src/data/newsEditorialValidation.mjs';
import {needsReview} from '../../scripts/news/review-migration.mjs';
import {validateGeneratedEditorial} from '../../scripts/news/cerebras-editorial.mjs';
const generated=()=>({...record.editorial.item,language:'zh',facts:record.editorial.evidence.facts,soWhat:structuredClone(record.editorial.soWhat),impactAssessment:record.editorial.impactAssessment,marketSignals:record.editorial.marketSignals,watchItems:record.editorial.watchItems});
it('withholds a cached summary interpretation that invents analyst attribution absent from source',()=>{
 expect(isPublishableNews(record)).toBe(false);
});
it('puts the cached unsupported attribution back in the review queue',()=>{
 expect(needsReview(record)).toBe(true);
});
it.each(['watchItems','marketSignals','political','impactAssessment'])('checks cached attribution in %s as well as the main narrative',field=>{
 const changed:any=structuredClone(record),claim='部分分析认为进口将降低成本。';
 changed.editorial.soWhat.counterView='若运输成本上升，价格支持可能被抵消。';
 if(field==='watchItems')changed.editorial.watchItems=[claim];
 if(field==='marketSignals')changed.editorial.marketSignals[0].reason=claim;
 if(field==='political')changed.editorial.political={channel:claim};
 if(field==='impactAssessment')changed.editorial.impactAssessment[4].invalidation=claim;
 expect(isPublishableNews(changed)).toBe(false);expect(needsReview(changed)).toBe(true);
});
it('rejects the same unsupported attribution before model audit',()=>{
 let reason;expect(validateGeneratedEditorial(generated(),record.article.text,(category)=>{reason=category;})).toBe(false);expect(reason).toBe('unsupported-attribution');
});
it('allows a clearly conditional counterview without inventing an outside analyst',()=>{
 const output=generated();output.soWhat.counterView='另一种可能是，若运输成本上升，新增供应对价格的影响可能被抵消。';
 expect(validateGeneratedEditorial(output,record.article.text)).toBe(true);
});
it('allows the reported analyst view when the actual source expressly contains it',()=>{
 expect(validateGeneratedEditorial(generated(),record.article.text+' Analysts say transportation costs could offset lower prices.')).toBe(true);
});
it('does not confuse a disclaimer about absent analyst evidence with an attributed view',()=>{
 const output=generated();output.soWhat.counterView='来源没有提供分析师认为进口成本会下降的证据。';
 expect(validateGeneratedEditorial(output,record.article.text)).toBe(true);
});
it('does not let one disclaimer excuse a separate invented analyst view',()=>{
 const output=generated();output.soWhat.counterView='来源没有提供分析师观点；部分分析认为进口会降低成本。';
 expect(validateGeneratedEditorial(output,record.article.text)).toBe(false);
});
