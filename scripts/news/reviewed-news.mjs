import { readJson } from '../snapshot-schema.mjs';
import { newsSources,articleSources } from './source-registry.mjs';
import { articleHash,fetchFullArticle,toPublicEvidence } from './full-article.mjs';
import { reviewChineseArticle } from './chinese-editorial.mjs';
export async function refreshReviewedNews(now,fetchImpl=fetch,records){
  const stored=records??(await readJson('public/data/reviewed-news.json'))?.items??[];
  return Promise.all(stored.map(async item=>{
    if(!item.article||item.editorial?.sourceBodyHash!==item.article.sha256) return undefined;
    if(typeof item.article.text==='string'&&articleHash(item.article.text)!==item.article.sha256) return undefined;
    if(item.article.text===undefined&&(!['cnfin-body','yicai-body'].includes(item.article.reader)||(item.article.characterCount??0)<100)) return undefined;
    const source=[...newsSources,...articleSources].find(source=>source.id===item.sourceId);
    if(!source) return undefined;
    let confirmedFailure;
    const article=await fetchFullArticle(item,source,now,fetchImpl,reason=>{confirmedFailure=reason;});
    // A failed request retains the actual previous verification time. Changed
    // content invalidates the old translation and interpretation as one unit.
    if(!article){
      if(!confirmedFailure) return item;
      return {...item,fetchedAt:now,editorial:undefined,article:{status:'unreadable',reader:item.article.reader,sha256:'0'.repeat(64),sourceUrl:item.canonicalUrl,checkedAt:now},invalidationReason:confirmedFailure};
    }
    const updated={...item,fetchedAt:now,article,editorial:article.sha256===item.article.sha256?item.editorial:undefined};
    return toPublicEvidence(updated.editorial?updated:reviewChineseArticle(updated));
  })).then(items=>items.filter(Boolean));
}
