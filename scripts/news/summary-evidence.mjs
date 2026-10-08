import {articleHash} from './full-article.mjs';
export function prepareNewsEvidence(record){
 if(record.article?.status==='complete') return record;
 const summary=record.originalSummary?.trim();
 if(typeof summary!=='string'||summary.length<80||summary===record.originalTitle||!['official','verified'].includes(record.sourceTier)) return record;
 const text=record.originalTitle+'\n'+summary;
 return {...record,article:{status:'summary',text,reader:'publisher-feed-summary',characterCount:text.length,sha256:articleHash(text),sourceUrl:record.canonicalUrl,checkedAt:record.fetchedAt}};
}
