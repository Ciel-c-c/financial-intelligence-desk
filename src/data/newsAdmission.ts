import type { LiveNewsItem } from './newsFeedTypes';

export function isPublishableNews(item:LiveNewsItem):boolean {
  const {article,editorial}=item;
  if(!article||!editorial||article.status!=='complete'||!/^[a-f0-9]{64}$/.test(article.sha256)) return false;
  const hasText=typeof article.text==='string'&&article.text.trim().length>=400;
  // This reader is validated server-side; its publisher's full body is never reprinted.
  const approvedChineseReader=(article.reader==='cnfin-body'&&/^https:\/\/www\.cnfin\.com\/yw-lb\/detail\/\d{8}\/\d+_1\.html$/.test(article.sourceUrl))
    ||(article.reader==='yicai-body'&&/^https:\/\/www\.yicai\.com\/news\/\d+\.html$/.test(article.sourceUrl));
  const chineseEvidence=article.text===undefined&&approvedChineseReader&&(article.characterCount??0)>=100;
  if(!hasText&&!chineseEvidence) return false;
  const content=editorial.item;
  if(!content||![content.facts,content.consensus,content.inference,content.risks,content.causalChain,editorial.watchItems].every(Array.isArray)) return false;
  return editorial.sourceBodyHash===article.sha256 && editorial.originalTitle===item.originalTitle
    && article.sourceUrl===item.canonicalUrl && content.sourceUrl===item.canonicalUrl
    && content.id===item.id && content.publishedAt===item.publishedAt
    && item.titleZh===content.title && item.summaryZh===content.summary
    && [content.title,content.summary,content.excerpt,...content.facts,...content.consensus,...content.inference,...content.risks].every(text=>typeof text==='string'&&/[\u3400-\u9fff]/.test(text))
    && content.facts.length>0 && content.consensus.length>0 && content.inference.length>0 && content.risks.length>0
    && content.causalChain.length>=3 && content.causalChain.length<=6
    && content.causalChain.every(step=>step&&[step.title,step.explanation,step.condition].every(text=>typeof text==='string'&&/[\u3400-\u9fff]/.test(text)))
    && editorial.watchItems.length>0 && Number.isFinite(Date.parse(article.checkedAt));
}

export async function verifyNewsEvidence(item:LiveNewsItem):Promise<boolean>{
  if(!isPublishableNews(item)) return false;
  if(item.article!.text===undefined) return true;
  try{
    const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(item.article!.text));
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===item.article!.sha256;
  }catch{return false;}
}
