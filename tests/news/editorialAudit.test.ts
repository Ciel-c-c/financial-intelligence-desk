import {expect,it} from 'vitest';
import {validateAudit,validateImpactAssessment,safeAuditFindings} from '../../scripts/news/editorial-audit.mjs';
const labels=['投资','汇率','住房','工作','消费','企业经营'];
const body='企业公布业务进展，订单落实可能影响采购。';
const selected=[{label:'企业经营',impact:'供应商订单可能变化',why:'业务落实传到采购',condition:'若订单没有落实，影响不成立'}];
const assessment=()=>labels.map(label=>({label,score:label==='企业经营'?3:0,audience:label==='企业经营'?'firms':'none',region:'事件相关地区',triggerEvidence:label==='企业经营'?'企业公布业务进展':null,path:label==='企业经营'?['业务落实','采购需求变化','供应商订单变化']:[],invalidation:'若事件没有改变订单，影响不成立'}));
it('accepts one strongly related dimension and excludes weak ones without filling a quota',()=>{
 expect(validateImpactAssessment(assessment(),selected,body)).toBe(true);
 const weak=assessment();weak[5].score=1;expect(validateImpactAssessment(weak,selected,body)).toBe(false);
});
it('rejects company procurement relabeled as ordinary consumer spending',()=>{
 const a=assessment();a[4]={...a[5],label:'消费'};a[5]={...a[5],score:0,audience:'none',triggerEvidence:null,path:[]};
 expect(validateImpactAssessment(a,[{...selected[0],label:'消费'}],body)).toBe(false);
});
it('rejects housing impact without an actual transmission path or supporting event evidence',()=>{
 const a=assessment();a[2]={...a[5],label:'住房',audience:'households',path:[]};expect(validateImpactAssessment(a,[{...selected[0],label:'住房'}],body)).toBe(false);
 const wrong=assessment();wrong[5].triggerEvidence='央行保证降息';expect(validateImpactAssessment(wrong,selected,body)).toBe(false);
});
it('requires a complete granular audit with an empty valid findings list before approval',()=>{
 const output={facts:[{}],causalChain:[{},{},{}],soWhat:{personalImpact:selected}},audit={approved:true,facts:[true],causalEdges:[true,true],personalImpacts:[true],scenariosAreConditional:true,findings:[]};
 expect(validateAudit(audit,output)).toBe(true);
 expect(validateAudit({...audit,findings:undefined},output)).toBe(false);
 for(const category of ['parallel-cause','causal-gap','impact-scope','invalidation'])expect(validateAudit({...audit,findings:[{category,section:'causalEdges',index:1}]},output)).toBe(false);
 expect(validateAudit({...audit,causalEdges:[true,false]},output)).toBe(false);
});
it('keeps only safe bounded rejection codes, not model prose',()=>{
 expect(safeAuditFindings({findings:[{category:'parallel-cause',section:'causalEdges',index:1,message:'do not log'},{category:'secret\ntext',section:'causalEdges',index:1}]})).toEqual([{category:'parallel-cause',section:'causalEdges',index:1}]);
});
it('identifies a rejected impact field without returning its unsupported quotation',()=>{
 const a=assessment();a[5].triggerEvidence='并不存在的原文';const reasons:string[]=[];
 expect(validateImpactAssessment(a,selected,body,reason=>reasons.push(reason))).toBe(false);
 expect(reasons).toEqual(['personalImpact[0].trigger-evidence']);
});
