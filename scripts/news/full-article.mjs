import { createHash } from 'node:crypto';
export const articleHash=text=>createHash('sha256').update(text).digest('hex');
// Reading for analysis is not permission to republish a publisher's full text.
export function toPublicEvidence(item){
 if(!['cnfin-body','yicai-body'].includes(item.article?.reader)) return item;
 const {text,...evidence}=item.article;
 return {...item,article:evidence};
}
const decode=value=>value.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/\s+/g,' ').trim();
export function extractOfficialArticle(html,expectedTitle){
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if(!main||decode(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??'')!==expectedTitle) return undefined;
  const section=main.match(/<div\b[^>]*class=["']section["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if(!section||[...section.matchAll(/<p\b/g)].length<2) return undefined;
  const text=decode(section);
  return text.length>=400?text:undefined;
}
export function extractChineseArticle(html,expectedTitle){
 const title=decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??'');
 if(title!==expectedTitle) return undefined;
 const section=html.match(/<div\b[^>]*class=["']xhcj_detail_main["'][^>]*>([\s\S]*?)<p\b[^>]*class=["']app-statement["']/i)?.[1];
 if(!section||!/<p\b/i.test(section)) return undefined;
 const text=decode(section);
 return text.length>=100?text:undefined;
}
export async function fetchFullArticle(item,source,checkedAt,fetchImpl=fetch,onConfirmedFailure=()=>{}){
  if(!((source.articlePolicy?.bodyFormat==='ecb-section'&&source.id==='ecb')||(source.articlePolicy?.bodyFormat==='cnfin-body'&&source.id==='cnfin')||(source.articlePolicy?.bodyFormat==='yicai-body'&&source.id==='yicai'))) return undefined;
  try{
    const url=new URL(item.canonicalUrl);
    if(url.protocol!=='https:'||!source.publisherDomains.some(domain=>url.hostname===domain||url.hostname.endsWith(`.${domain}`))||!url.pathname.replace(/\/{2,}/g,'/').startsWith(source.articlePolicy.pathPrefix)) return undefined;
    // Do not follow redirects through an unverified publisher or bypass a paywall.
    const response=await fetchImpl(url.toString(),{redirect:'error',signal:AbortSignal.timeout(15000),headers:{'user-agent':'Financial-Lens-News/1.0'}});
    if(!response.ok){if([404,410].includes(response.status)) onConfirmedFailure('withdrawn');return undefined;}
    if(response.url&&new URL(response.url).hostname!==url.hostname){onConfirmedFailure('publisher-mismatch');return undefined;}
    const html=await response.text();
    const text=source.id==='yicai'?extractYicaiArticle(html,item.originalTitle):source.id==='cnfin'?extractChineseArticle(html,item.originalTitle):extractOfficialArticle(html,item.originalTitle);
    if(!text){onConfirmedFailure('body-mismatch');return undefined;}
    return {status:'complete',text,characterCount:text.length,reader:source.articlePolicy.bodyFormat,sha256:articleHash(text),sourceUrl:item.canonicalUrl,checkedAt};
  }catch{return undefined;}
}
function extractYicaiArticle(html,expectedTitle){
 if(decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??'')!==expectedTitle) return undefined;
 const section=html.match(/<div\b[^>]*id=["']multi-text["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*id=["']jb_report["']/i)?.[1];
 if(!section||[...section.matchAll(/<p\b/g)].length<2) return undefined;
 const text=decode(section);return text.length>=100?text:undefined;
}
