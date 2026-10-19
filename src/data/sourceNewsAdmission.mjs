import {isSourceAllowed} from './factualSummaryValidation.mjs';
/** Source-only publication never licenses an unreviewed translation or inference. */
export function isVerifiedSourceNews(record,policies,now=new Date().toISOString()){
 const a=record?.article,time=Date.parse(now),published=Date.parse(record?.publishedAt),checked=Date.parse(a?.checkedAt);
 return !record?.invalidationReason&&isSourceAllowed(record,policies,now)&&typeof record.originalTitle==='string'&&record.originalTitle.trim().length>0
  &&Number.isFinite(published)&&published<=time&&Number.isFinite(checked)&&checked<=time&&a?.sourceUrl===record.canonicalUrl
  &&a.status==='complete'&&['cnfin-body','yicai-body','ths-body'].includes(a.reader)&&/^[a-f0-9]{64}$/.test(a.sha256)
  &&(typeof a.text==='string'?a.text.length>=100:(a.characterCount??0)>=100);
}
