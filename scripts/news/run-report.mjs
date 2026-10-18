import {readFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateFactualSummary} from './factual-summary.mjs';
import {buildSourcePolicies} from './source-policy.mjs';
import {newsSources} from './source-registry.mjs';
import {isPublishableNews} from '../../src/data/newsEditorialValidation.mjs';
export function newsRunReport(snapshot){
 const now=snapshot.attemptedAt, policies=buildSourcePolicies(newsSources,now);
 const rows=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].filter((r,i,a)=>a.findIndex(v=>v.id===r.id)===i);
 const current=rows.filter(r=>Date.parse(now)>=Date.parse(r.publishedAt)&&Date.parse(now)-Date.parse(r.publishedAt)<=86400000);
 const published=current.filter(r=>isPublishableNews(r)||r.factualSummary&&validateFactualSummary(r,r.factualSummary,policies,now));
 const sources=snapshot.sourceHealth.filter(h=>newsSources.some(s=>s.id===h.id));
 const sourceSucceeded=sources.filter(s=>s.status==='ok').length,sourceFailed=sources.length-sourceSucceeded,sourceItemCount=sources.filter(s=>s.status==='ok').reduce((n,s)=>n+s.itemCount,0);
 const fetchStatus=sourceSucceeded===0?(sourceFailed?'failed':'not_attempted'):sourceFailed?'partial':sourceItemCount>0?'fetched':'no_new_source_items';
 const deep=snapshot.sourceHealth.find(h=>h.id==='groq-editorial');
 const generated=deep?.itemCount??0,attempted=deep?.attempted??0,rejected=deep?.rejected??0,failures=deep?.failures??0;
 const deepStatus=generated>0?'generated':failures>0||deep?.error?'failed':rejected>0?'rejected':deep?.status==='error'?'failed':attempted>0?'rejected':'not_attempted';
 return {attemptedAt:now,news:{fetch:fetchStatus,sourceSucceeded,sourceFailed,sourceItemCount,publishedCurrent:published.length,retained:rows.length-current.length,status:published.length?'published':'no_current_publishable_content'},deep:{status:deepStatus,attempted,generated,rejected,failures,availableCurrent:current.filter(isPublishableNews).length,rejectionReasons:deep?.rejectionReasons??{}},limitations:['发布数量包括本轮仍有效的缓存，不能等同于本轮新增。','工作流成功不代表生成成功；未尝试、拒绝和失败分别记录。']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const report=newsRunReport(JSON.parse(await readFile(resolve('public/data/news-feed.json'),'utf8')));
 console.log(JSON.stringify(report,null,2));
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'## 新闻与解读产出（分别验收）\n```json\n'+JSON.stringify(report,null,2)+'\n```\n');
}
