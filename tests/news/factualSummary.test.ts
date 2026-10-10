import {expect,it} from 'vitest';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {newsSources} from '../../scripts/news/source-registry.mjs';
import {buildSourcePolicies} from '../../scripts/news/source-policy.mjs';
import {summaryCacheKey,validateFactualSummary} from '../../scripts/news/factual-summary.mjs';
import {isPublishableSummary,verifyNewsEvidence} from '../../src/data/newsAdmission';
import {webcrypto} from 'node:crypto';
import {vi,afterEach} from 'vitest';
const now='2026-10-09T14:00:00Z';
const originalSummary='联合国开发计划署发布报告，介绍冲突与经济动荡对就业和基本服务的影响。报告指出相关家庭面临资源不足，后续改善仍取决于政策落实和公共服务恢复，不能由这份报告直接判断全球股市涨跌。';
const originalTitle='联合国开发计划署发布经济与就业报告',url='https://news.un.org/feed/view/zh/story/2026/10/1142960',text=originalTitle+'\n'+originalSummary;
const record:any={id:'summary-test',sourceId:'un-zh',sourceTier:'official',verificationStatus:'official',originalTitle,originalSummary,originalLanguage:'zh',translationStatus:'original-zh',canonicalUrl:url,publishedAt:now,article:{status:'summary',reader:'publisher-feed-summary',text,sha256:articleHash(text),sourceUrl:url,checkedAt:now}};
const summary={language:'zh',title:originalTitle,summary:originalSummary,originalTitle,sourceUrl:url,publishedAt:now,sourceHash:record.article.sha256,evidenceScope:'summary',reviewVersion:'factual-v1',checkedAt:now,origin:'publisher-zh',evidence:[]};
const policies=buildSourcePolicies(newsSources,now);
afterEach(()=>vi.unstubAllGlobals());
it('admits an independent Chinese factual summary without an editorial',async()=>{
 expect(validateFactualSummary(record,summary,policies,now)).toBe(true);
 vi.stubGlobal('crypto',webcrypto);
 expect(isPublishableSummary({...record,factualSummary:summary})).toBe(true);
 expect(await verifyNewsEvidence({...record,factualSummary:summary})).toBe(true);
});
it('rejects changed identity, source evidence and fabricated publisher summaries',()=>{
 for(const patch of [{originalTitle:'另一新闻'},{publishedAt:'2026-10-10T00:00:00Z'},{sourceHash:'a'.repeat(64)},{summary:'只有标题'},{summary:originalSummary+'另行增加的事实。'}]) expect(validateFactualSummary(record,{...summary,...patch},policies,now)).toBe(false);
 expect(validateFactualSummary({...record,invalidationReason:'withdrawn'},summary,policies,now)).toBe(false);
 expect(validateFactualSummary({...record,canonicalUrl:'https://evil.test/news'},summary,policies,now)).toBe(false);
});
it('invalidates caches on title, date, content and processing-version changes',()=>{
 const key=summaryCacheKey(record,'factual-v1');
 for(const patch of [{originalTitle:'改过标题'},{publishedAt:'2026-10-09T13:00:00Z'},{originalSummary:'改过摘要'},{article:{...record.article,sha256:'b'.repeat(64)}}]) expect(summaryCacheKey({...record,...patch},'factual-v1')).not.toBe(key);
 expect(summaryCacheKey(record,'factual-v2')).not.toBe(key);
});
it('requires paired source evidence and a review for generated summaries',()=>{
 const generated={...summary,origin:'model',review:{approved:true,model:'openai/gpt-oss-20b'},evidence:[{text:originalSummary,quote:originalSummary.slice(0,80)}]};
 expect(validateFactualSummary(record,generated,policies,now)).toBe(true);
 expect(validateFactualSummary(record,{...generated,review:undefined},policies,now)).toBe(false);
 expect(validateFactualSummary(record,{...generated,evidence:[{text:originalSummary,quote:'并不存在的引用'}]},policies,now)).toBe(false);
});
it('reports a safe failure field without copying source or model prose',()=>{
 const reasons:string[]=[];validateFactualSummary(record,{...summary,summary:'只有标题'},policies,now,reason=>reasons.push(reason));
 expect(reasons).toEqual(['summary-length']);
});
