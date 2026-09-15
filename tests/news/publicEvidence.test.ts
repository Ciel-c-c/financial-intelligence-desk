import { expect,it } from 'vitest';
import { toPublicEvidence } from '../../scripts/news/full-article.mjs';
it('removes copyrighted source bodies while retaining provenance and original analysis',()=>{
 const record={sourceId:'cnfin',article:{text:'不应转载的完整媒体正文',sha256:'a'.repeat(64),status:'complete',reader:'cnfin-body',characterCount:200,sourceUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470069_1.html'},editorial:{sourceBodyHash:'a'.repeat(64)}};
 const result=toPublicEvidence(record);
 expect(result.article.text).toBeUndefined();
 expect(result.article.sha256).toBe('a'.repeat(64));
 expect(result.editorial.sourceBodyHash).toBe('a'.repeat(64));
 expect(record.article.text).toBe('不应转载的完整媒体正文');
});
