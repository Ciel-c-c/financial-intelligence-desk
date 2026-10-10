import {expect,it} from 'vitest';
import {buildNewsAcceptance} from '../../scripts/news/acceptance.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
it('counts an audited Chinese-source body summary as Chinese coverage',()=>{
 const now='2026-10-10T08:00:00Z',title='企业发布业务进展',summary='企业发布业务进展，介绍当前订单落实与成本控制情况。报道强调后续盈利仍取决于交付和经营成本变化，不能把业务进展直接理解为所有相关股票都会上涨，还需要结合下一期收入和利润数据观察。';
 const record=prepareNewsEvidence({id:'cn-model-summary',sourceId:'cnfin',sourceTier:'verified',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20261010/4475000_1.html',originalTitle:title,originalSummary:summary,originalLanguage:'zh',publishedAt:now,fetchedAt:now});
 record.factualSummary={language:'zh',title,originalTitle:title,summary,sourceUrl:record.canonicalUrl,publishedAt:now,sourceHash:record.article.sha256,evidenceScope:'summary',reviewVersion:'factual-v1',checkedAt:now,origin:'model',evidence:[{text:'企业发布业务进展。',quote:'企业发布业务进展，介绍当前订单落实与成本控制情况。'}],review:{approved:true,model:'openai/gpt-oss-20b'}};
 const result=buildNewsAcceptance({attemptedAt:now,latest:[record],status:'fresh',sourceHealth:[]},undefined);
 expect(result.current.publisher).toBe(1);expect(result.current.translated).toBe(0);
});
it('does not count a model-version marker on an incomplete editorial as a deep interpretation',()=>{
 const hash='a'.repeat(64),news={attemptedAt:'2026-10-09T14:00:00Z',latest:[{publishedAt:'2026-10-09T14:00:00Z',article:{sha256:hash},editorial:{sourceBodyHash:hash,generator:{review:'edge-audit-v4'}}}],status:'fresh',sourceHealth:[]};
 expect(buildNewsAcceptance(news,undefined).current.deep).toBe(0);
});
it('does not turn a manual or empty workflow success into three scheduled content passes',()=>{
 const news={attemptedAt:'2026-10-09T14:00:00Z',latest:[],status:'fresh',sourceHealth:[]};
 const manual=buildNewsAcceptance(news,undefined,{scheduled:false});expect(manual.scheduledCycles).toEqual([]);expect(manual.status).toBe('pending');
 const scheduled=buildNewsAcceptance(news,manual,{scheduled:true});expect(scheduled.scheduledCycles[0].passed).toBe(false);expect(scheduled.status).toBe('pending');
});
it('does not count the same scheduled cycle twice',()=>{
 const news={attemptedAt:'2026-10-09T14:00:00Z',latest:[],status:'fresh',sourceHealth:[]};
 const first=buildNewsAcceptance(news,undefined,{scheduled:true});expect(buildNewsAcceptance(news,first,{scheduled:true}).scheduledCycles).toHaveLength(1);
});
