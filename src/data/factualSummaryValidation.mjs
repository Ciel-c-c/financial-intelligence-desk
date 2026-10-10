export function isSourceAllowed(record,policies,now=new Date().toISOString()){
 try{
  const p=policies.find(p=>p.id===record.sourceId),url=new URL(record.canonicalUrl),time=Date.parse(now);
  return !!p&&p.tier===record.sourceTier&&Number.isFinite(time)&&time>=Date.parse(p.verifiedAt)&&time<=Date.parse(p.expiresAt)
   &&url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&p.allowedHosts.includes(url.hostname)
   &&p.allowedPathPatterns.some(pattern=>new RegExp(pattern).test(url.pathname));
 }catch{return false;}
}
export function validateFactualSummary(record,s,policies,now=new Date().toISOString(),onReject=()=>{}){
 const reject=reason=>{onReject(reason);return false;};
 const a=record.article,time=Date.parse(now),zh=value=>typeof value==='string'&&value.trim().length>0&&/[\u3400-\u9fff]/.test(value);
 if(s&&typeof s.summary==='string'&&(s.summary.trim().length<40||s.summary.length>1200))return reject('summary-length');
 if(record.invalidationReason||!s||!isSourceAllowed(record,policies,now)||!a||!['complete','summary'].includes(a.status)
  ||s.language!=='zh'||!zh(s.title)||!zh(s.summary)||s.summary.trim().length<40||s.summary.length>1200||s.summary.trim()===s.title.trim()
  ||s.originalTitle!==record.originalTitle||s.sourceUrl!==record.canonicalUrl||a.sourceUrl!==record.canonicalUrl||s.publishedAt!==record.publishedAt
  ||!Number.isFinite(Date.parse(s.publishedAt))||Date.parse(s.publishedAt)>time||!Number.isFinite(Date.parse(s.checkedAt))||Date.parse(s.checkedAt)>time
  ||s.sourceHash!==a.sha256||!/^[a-f0-9]{64}$/.test(s.sourceHash)||s.reviewVersion!=='factual-v1'
  ||s.evidenceScope!==(a.status==='summary'?'summary':'full-body')) return reject('identity-language-or-scope');
 const p=policies.find(p=>p.id===record.sourceId);
 if(a.status==='summary'&&(a.reader!=='publisher-feed-summary'||a.text!==record.originalTitle+'\n'+record.originalSummary?.trim()||(record.originalSummary?.trim().length??0)<80)) return reject('source-summary-binding');
 const body=a.text;
 if(typeof body!=='string'&&!(a.reader==='cnfin-body'&&(a.characterCount??0)>=100))return reject('source-body');
 if(s.origin==='publisher-zh')return p.summaryMode==='publisher'&&record.originalLanguage==='zh'&&s.title===record.originalTitle&&s.summary===record.originalSummary?.trim()&&s.summary.length>=80||reject('publisher-policy-or-text');
 if(s.origin!=='model'||s.review?.approved!==true||s.review.model!=='openai/gpt-oss-20b'||!Array.isArray(s.evidence)||!s.evidence.length||s.evidence.length>5)return reject('review-or-evidence-structure');
 const nums=value=>value.match(/\d+(?:[.,]\d+)*(?:%|％)?/g)??[];
 const paired=s.evidence.every(f=>zh(f.text)&&typeof f.quote==='string'&&f.quote.length>=6&&f.quote.length<=120
  &&(typeof body!=='string'||body.includes(f.quote))&&nums(f.text).every(n=>nums(f.quote).includes(n)))
 if(!paired)return reject('paired-evidence');
 return typeof body!=='string'||nums(s.title+' '+s.summary).every(n=>body.includes(n))||reject('unsupported-numbers');
}
