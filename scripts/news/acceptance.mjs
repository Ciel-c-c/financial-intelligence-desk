import {validateFactualSummary} from './factual-summary.mjs';
import {buildSourcePolicies} from './source-policy.mjs';
import {newsSources} from './source-registry.mjs';
import {EDITORIAL_REVIEW_VERSION} from './editorial-audit.mjs';
import {isPublishableNews} from '../../src/data/newsEditorialValidation.mjs';
import {needsReview} from './review-migration.mjs';
export function buildNewsAcceptance(news,previous,{scheduled=false}={}){
 const now=news.attemptedAt,policies=buildSourcePolicies(newsSources,now),rows=(news.latest??[]).filter(r=>{const age=Date.parse(now)-Date.parse(r.publishedAt);return age>=0&&age<=86400_000;}),health=news.sourceHealth??[];
 const requests=health.find(h=>h.id==='groq-summary')?.requests??0;
 const publisher=rows.filter(r=>r.originalLanguage==='zh'&&r.factualSummary&&validateFactualSummary(r,r.factualSummary,policies,now)).length;
 const translated=rows.filter(r=>r.originalLanguage==='en'&&r.factualSummary?.origin==='model'&&validateFactualSummary(r,r.factualSummary,policies,now)).length;
 const deep=rows.filter(r=>isPublishableNews(r)&&!needsReview(r)).length;
 const bounded=Number.isInteger(requests)&&requests>=0&&requests<=12&&(health.find(h=>h.id==='groq-summary')?.attempted??0)<=2&&(health.find(h=>h.id==='groq-editorial')?.attempted??0)<=2;
 const passed=publisher>0&&translated>0&&deep>0&&bounded&&news.status!=='source_error'&&!health.some(h=>h.id.startsWith('groq-')&&h.status==='error');
 const sameVersion=previous?.reviewVersion===EDITORIAL_REVIEW_VERSION;
 const cycles=sameVersion?previous.scheduledCycles??[]:[];
 const distinct=cycles.at(-1)?.attemptedAt!==now;
 const next=scheduled&&distinct?[...cycles,{attemptedAt:now,passed,publisher,translated,deep,requests}].slice(-3):cycles;
 return {schemaVersion:1,reviewVersion:EDITORIAL_REVIEW_VERSION,attemptedAt:now,scheduledCycles:next,status:next.length===3&&next.every(c=>c.passed)?'runtime-checked':'pending',current:{publisher,translated,deep,requests,bounded,passed},limitations:['自动检查验证结构、版本、来源绑定和运行状态，不证明所有语义判断正确。','本阶段不验收股票行情或机构研报。']};
}
