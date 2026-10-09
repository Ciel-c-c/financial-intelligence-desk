export const EDITORIAL_REVIEW_VERSION='edge-audit-v3';
export const IMPACT_LABELS=['投资','汇率','住房','工作','消费','企业经营'];
export const AUDIT_CATEGORIES=['fact-evidence','translation','parallel-cause','causal-gap','expectation-attribution','impact-scope','invalidation'];
const sections=['facts','causalEdges','personalImpacts','expectations','scenarios'];
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
export function safeAuditFindings(audit){
 return (Array.isArray(audit?.findings)?audit.findings:[]).filter(f=>AUDIT_CATEGORIES.includes(f?.category)&&sections.includes(f.section)&&Number.isInteger(f.index)&&f.index>=0&&f.index<20).map(({category,section,index})=>({category,section,index})).slice(0,10);
}
export function validateAudit(audit,output){
 const passed=(checks,count)=>Array.isArray(checks)&&checks.length===count&&checks.every(check=>check===true);
 return audit?.approved===true&&Array.isArray(audit.findings)&&audit.findings.length===0&&audit.scenariosAreConditional===true
  &&passed(audit.facts,output.facts.length)&&passed(audit.causalEdges,output.causalChain.length-1)&&passed(audit.personalImpacts,output.soWhat.personalImpact.length);
}
export function validateImpactAssessment(assessment,selected,body){
 if(!Array.isArray(assessment)||assessment.length!==6||new Set(assessment.map(a=>a.label)).size!==6||!assessment.every(a=>IMPACT_LABELS.includes(a.label)&&Number.isInteger(a.score)&&a.score>=0&&a.score<=3)
  ||!Array.isArray(selected)||selected.length<1||selected.length>5||new Set(selected.map(i=>i.label)).size!==selected.length)return false;
 const audiences={'投资':['investors'],'汇率':['households','firms','investors'],'住房':['households','firms'],'工作':['workers'],'消费':['households'],'企业经营':['firms']};
 return selected.every(item=>{
  const a=assessment.find(a=>a.label===item.label);
  return a?.score>=2&&audiences[item.label]?.includes(a.audience)&&nonempty(a.region)&&nonempty(a.invalidation)
   &&Array.isArray(a.path)&&a.path.length>=3&&a.path.length<=6&&a.path.every(nonempty)
   &&nonempty(a.triggerEvidence)&&a.triggerEvidence.length>=6&&a.triggerEvidence.length<=120&&body.includes(a.triggerEvidence);
 });
}
