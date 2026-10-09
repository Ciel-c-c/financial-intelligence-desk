import type { LiveNewsItem } from './newsFeedTypes';
import {newsSourcePolicies} from './newsSourcePolicy.generated';
import {validateFactualSummary,isSourceAllowed} from './factualSummaryValidation.mjs';
import {isPublishableNews as validateEditorial} from './newsEditorialValidation.mjs';

export function isPublishableSummary(item:LiveNewsItem):boolean {
 if(item.factualSummary)return validateFactualSummary(item,item.factualSummary,newsSourcePolicies);
 if(!isSourceAllowed(item,newsSourcePolicies)||newsSourcePolicies.find(p=>p.id===item.sourceId)?.summaryMode!=='publisher')return false;
 const a=item.article,summary=item.originalSummary?.trim();
 if(item.editorial||item.invalidationReason||item.originalLanguage!=='zh'||item.translationStatus!=='original-zh'||!summary||summary.length<80||summary===item.originalTitle) return false;
 try {
  const url=new URL(item.canonicalUrl);
  const approved=(url.hostname==='news.un.org'&&/^\/(?:feed\/view\/)?zh\/story\//.test(url.pathname)&&item.sourceTier==='official'&&item.verificationStatus==='official')
    ||(url.hostname==='www.cnfin.com'&&url.pathname.startsWith('/yw-lb/detail/')&&item.sourceTier==='verified'&&['verified','cross-checked'].includes(item.verificationStatus));
  return approved&&url.protocol==='https:'&&!!a&&a.status==='summary'&&a.reader==='publisher-feed-summary'
   &&a.sourceUrl===item.canonicalUrl&&a.text===item.originalTitle+'\n'+summary&&/^[a-f0-9]{64}$/.test(a.sha256)
   &&Number.isFinite(Date.parse(a.checkedAt))&&Number.isFinite(Date.parse(item.publishedAt))&&Date.parse(item.publishedAt)<=Date.now();
 }catch{return false;}
}

export function isPublishableNews(item:LiveNewsItem):boolean{return validateEditorial(item);}

export async function verifyNewsEvidence(item:LiveNewsItem):Promise<boolean>{
  if(!isPublishableNews(item)&&!isPublishableSummary(item)) return false;
  if(item.article!.text===undefined) return true;
  try{
    const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(item.article!.text));
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===item.article!.sha256;
  }catch{return false;}
}
