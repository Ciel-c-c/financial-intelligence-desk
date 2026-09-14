import { describe, expect, it, vi } from 'vitest';
import { enrichNewsItems, validateTranslation } from '../../scripts/news/news-enrichment.mjs';

const item:any={ id:'x',originalLanguage:'en',originalTitle:'Fed keeps rate at 4.25% on September 14',originalSummary:'The Federal Reserve held the rate at 4.25%.',translationStatus:'unavailable' };
describe('news enrichment',()=>{
  it('accepts structured Chinese text while preserving protected tokens',()=>{
    expect(validateTranslation(item,{titleZh:'美联储于 September 14 维持利率在 4.25%',summaryZh:'Federal Reserve 将利率维持在 4.25%。'})).toBe(true);
    expect(validateTranslation(item,{titleZh:'美联储维持利率',summaryZh:'利率不变。'})).toBe(false);
  });
  it('uses generated, cached, then original-language fallbacks',async()=>{
    const fetchImpl=vi.fn().mockResolvedValue({ok:true,json:async()=>({titleZh:'美联储于 September 14 维持利率在 4.25%',summaryZh:'Federal Reserve 将利率维持在 4.25%。'})});
    const generated=await enrichNewsItems([item],{endpoint:'https://api.test',apiKey:'k',model:'m',fetchImpl,cache:{}});
    expect(generated[0].translationStatus).toBe('generated');
    const cached=await enrichNewsItems([item],{cache:{[generated[0].contentFingerprint]:{titleZh:'缓存 4.25% September 14',summaryZh:'Federal Reserve 缓存 4.25%。'}}});
    expect(cached[0].translationStatus).toBe('cached');
    const fallback=await enrichNewsItems([item],{cache:{}});
    expect(fallback[0]).toMatchObject({translationStatus:'unavailable',titleZh:undefined});
  });
});
