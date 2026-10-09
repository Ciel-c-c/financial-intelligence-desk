import type { LiveNewsItem } from './newsFeedTypes';

export function isPublishableSummary(item:LiveNewsItem):boolean {
 const a=item.article,summary=item.originalSummary?.trim();
 if(item.editorial||item.invalidationReason||item.originalLanguage!=='zh'||item.translationStatus!=='original-zh'||!summary||summary.length<80||summary===item.originalTitle) return false;
 try {
  const url=new URL(item.canonicalUrl);
  const approved=(url.hostname==='news.un.org'&&url.pathname.startsWith('/zh/')&&item.sourceTier==='official'&&item.verificationStatus==='official')
    ||(url.hostname==='www.cnfin.com'&&url.pathname.startsWith('/yw-lb/detail/')&&item.sourceTier==='verified'&&['verified','cross-checked'].includes(item.verificationStatus));
  return approved&&url.protocol==='https:'&&!!a&&a.status==='summary'&&a.reader==='publisher-feed-summary'
   &&a.sourceUrl===item.canonicalUrl&&a.text===item.originalTitle+'\n'+summary&&/^[a-f0-9]{64}$/.test(a.sha256)
   &&Number.isFinite(Date.parse(a.checkedAt))&&Number.isFinite(Date.parse(item.publishedAt))&&Date.parse(item.publishedAt)<=Date.now();
 }catch{return false;}
}

export function isPublishableNews(item:LiveNewsItem):boolean {
  const {article,editorial}=item;
  if(!article||!editorial||!['complete','summary'].includes(article.status)||!/^[a-f0-9]{64}$/.test(article.sha256)) return false;
  const summaryEvidence=article.status==='summary'&&editorial.evidenceScope==='summary'&&article.reader==='publisher-feed-summary'&&(item.originalSummary?.trim().length??0)>=80&&article.text===item.originalTitle+'\n'+item.originalSummary?.trim();
  if(article.status==='summary'&&!summaryEvidence) return false;
  const hasText=typeof article.text==='string'&&article.text.trim().length>=400;
  // This reader is validated server-side; its publisher's full body is never reprinted.
  const approvedChineseReader=(article.reader==='cnfin-body'&&/^https:\/\/www\.cnfin\.com\/yw-lb\/detail\/\d{8}\/\d+_1\.html$/.test(article.sourceUrl))
    ||(article.reader==='yicai-body'&&/^https:\/\/www\.yicai\.com\/news\/\d+\.html$/.test(article.sourceUrl));
  const chineseEvidence=article.text===undefined&&approvedChineseReader&&(article.characterCount??0)>=100;
  if(!hasText&&!chineseEvidence&&!summaryEvidence) return false;
  const content=editorial.item;
  if(!content||![content.facts,content.consensus,content.inference,content.risks,content.causalChain,editorial.watchItems].every(Array.isArray)) return false;
  const language=editorial.language??'zh';
  if(!['zh','en'].includes(language)) return false;
  const validText=(text:unknown)=>typeof text==='string'&&text.trim().length>0&&(language==='zh'?/[\u3400-\u9fff]/.test(text):/[A-Za-z]/.test(text)&&!/[\u3400-\u9fff]/.test(text));
  return editorial.sourceBodyHash===article.sha256 && editorial.originalTitle===item.originalTitle
    && article.sourceUrl===item.canonicalUrl && content.sourceUrl===item.canonicalUrl
    && content.id===item.id && content.publishedAt===item.publishedAt
    && (language==='en'?item.titleEn===content.title&&item.summaryEn===content.summary:item.titleZh===content.title&&item.summaryZh===content.summary)
    && [content.title,content.summary,content.excerpt,...content.facts,...content.consensus,...content.inference,...content.risks,...editorial.watchItems].every(validText)
    && content.facts.length>0 && content.consensus.length>0 && content.inference.length>0 && content.risks.length>0
    && content.causalChain.length>=3 && content.causalChain.length<=6
    && content.causalChain.every(step=>step&&[step.title,step.explanation,step.condition].every(validText))
    && editorial.watchItems.length>0 && Number.isFinite(Date.parse(article.checkedAt));
}

export async function verifyNewsEvidence(item:LiveNewsItem):Promise<boolean>{
  if(!isPublishableNews(item)&&!isPublishableSummary(item)) return false;
  if(item.article!.text===undefined) return true;
  try{
    const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(item.article!.text));
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===item.article!.sha256;
  }catch{return false;}
}
