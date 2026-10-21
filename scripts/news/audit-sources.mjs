import {newsSources} from './source-registry.mjs';
import {buildSourcePolicies,isSourceAllowed} from './source-policy.mjs';
import {normalizeNewsItem} from './news-normalizer.mjs';
import {clusterNewsItems} from './news-clusterer.mjs';
/** Compare captured fetch results with the snapshot and the actual frontend admission output. No model calls or publication. */
export function auditSources({sourceResults,snapshot,visible,now=snapshot.attemptedAt}){
 const policies=buildSourcePolicies(newsSources,now);
 return newsSources.filter(s=>s.enabled).map(source=>{
  const result=sourceResults.find(r=>r.id===source.id),items=result?.items??[],urls=new Set(items.map(item=>item.canonicalUrl));
  const latestFromFetch=snapshot.latest.filter(n=>n.sourceId===source.id&&urls.has(n.canonicalUrl)&&!n.invalidationReason&&isSourceAllowed(n,policies,now)).length;
  const visibleFromFetch=visible.filter(n=>n.sourceId===source.id&&urls.has(n.canonicalUrl)).length;
  return {id:source.id,name:source.name,fetched:result?.ok?(result.fetchedItemCount??null):0,parsed:result?.ok?(result.parsedItemCount??items.length):0,ingested:items.length,sourceApproved:items.map(normalizeNewsItem).filter(n=>isSourceAllowed(n,policies,now)).length,latestFromFetch,visibleFromFetch,latest:snapshot.latest.filter(n=>n.sourceId===source.id).length,visible:visible.filter(n=>n.sourceId===source.id).length,clustered:clusterNewsItems(items.map(normalizeNewsItem)).length,...(result?.error?{error:result.error}:{})};
 });
}

// Explicit diagnostic entry point. All generated files stay in the requested audit directory.
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [{readFile,writeFile,mkdir},{fetchNewsSource},{buildNewsSnapshot},{validateNewsSnapshot},{createServer},{orderDiverseNews}]=await Promise.all([import('node:fs/promises'),import('./fetch-news-sources.mjs'),import('./update-news-feed.mjs'),import('./news-contract.mjs'),import('vite'),import('../../src/data/newsDiversity.mjs')]);
 const out=resolve(process.argv[2]??'artifacts/source-audit');
 if(out===resolve('public/data')||out.startsWith(resolve('public/data')+'/')||out.startsWith(resolve('public/data')+'\\'))throw Error('Audit output must be outside published data');
 await mkdir(out,{recursive:true});
 const now=new Date().toISOString(),read=async path=>JSON.parse(await readFile(path,'utf8'));
 const previous=await read('public/data/news-feed.json'),reviewed=await read('public/data/reviewed-news.json');
 const sourceResults=await Promise.all(newsSources.filter(s=>s.enabled).map(s=>fetchNewsSource(s,now)));
 const snapshot=await buildNewsSnapshot({now,sourceResults,previous,enrichmentOptions:{processingStage:'source'}});
 if(!validateNewsSnapshot(snapshot))throw Error('Diagnostic snapshot invalid');
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {loadNewsFeed}=await server.ssrLoadModule('/src/data/newsFeed.ts');
  const {presentNews}=await server.ssrLoadModule('/src/data/newsPresentation.ts');
  const {isRecentNews}=await server.ssrLoadModule('/src/data/newsDates.ts');
  const feed=await loadNewsFeed(async path=>({ok:true,json:async()=>String(path).includes('reviewed-news')?reviewed:snapshot}));
  const all=[...feed.latest,...feed.continuing,...feed.retainedDetails].filter((n,i,a)=>a.findIndex(r=>r.id===n.id)===i);
  const visible=orderDiverseNews(clusterNewsItems(all.filter(n=>presentNews(n)&&isRecentNews(n.publishedAt))),now);
  const report={checkedAt:now,baselineSnapshotAt:previous.attemptedAt,modelRequests:0,rows:auditSources({sourceResults,snapshot,visible,now}),highlights:visible.slice(0,8).map(n=>({id:n.id,source:n.sourceName,title:n.originalTitle}))};
  await writeFile(join(out,'source-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }finally{await server.close();}
}
