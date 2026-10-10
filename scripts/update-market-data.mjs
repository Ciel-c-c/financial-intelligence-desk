import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readJson,writeJsonAtomic} from './snapshot-schema.mjs';
import {fetchMarketSources} from './site/market-fetch.mjs';
import {mergeMarketSessions,selectCurrentMarketItems,validateMarketSessions,MARKET_GROUPS} from './site/market-sessions.mjs';
import {buildMarketOverview,validateMarketOverview} from './site/market-pipeline.mjs';
import {reconcileMarketSummaries} from './site/market-close-summary.mjs';
import {buildSiteSnapshot,validateSiteSnapshot} from './site/site-contract.mjs';
export async function updateMarketData({now=new Date().toISOString(),dataDir=resolve('public/data'),sources,fetchImpl=fetch,sourceResults,write=true}={}){
 const [previous,oldSessions]=await Promise.all(['market-overview.json','market-sessions.json'].map(file=>readJson(join(dataDir,file))));
 const results=sourceResults??await fetchMarketSources({sources,now,fetchImpl});
 const merged=mergeMarketSessions({previous:oldSessions,observations:results.flatMap(r=>r.status==='ok'?r.instruments:[]),attemptedAt:now});
 const items=selectCurrentMarketItems(merged.snapshot).map(o=>({...o,freshness:Date.parse(now)-Date.parse(o.dataAsOf)>36*3600_000?'delayed':o.freshness}));
 const projected=results.map(r=>({...r,instruments:r.status==='ok'?items.filter(o=>o.group===r.market&&o.source.id===r.sourceId&&r.instruments.some(raw=>raw.id===o.id&&raw.tradingDate===o.tradingDate&&raw.session===o.session&&raw.value===o.value)):[]}));
 for(const conflict of merged.conflicts)projected.push({sourceId:'conflict-'+conflict.id,market:conflict.group,status:'error',instruments:[],error:conflict.reason});
 const retained={...previous,groups:Object.fromEntries(MARKET_GROUPS.map(g=>[g,[...items.filter(o=>o.group===g),...(previous?.groups?.[g]??[]).filter(o=>!items.some(current=>current.group===g&&current.id===o.id))]]))};
 let market=buildMarketOverview({attemptedAt:now,sourceResults:projected,previous:retained});
 market.sourceHealth=results.map(r=>({id:r.sourceId,status:r.status,itemCount:r.instruments.length,...(r.error?{error:r.error}:{})})).concat(merged.conflicts.map(c=>({id:'conflict-'+c.id,status:'error',itemCount:0,error:c.reason})));
 market.lastSuccessfulAt=merged.newObservationCount?now:previous?.lastSuccessfulAt??null;
 market=reconcileMarketSummaries({market,news:await readJson(join(dataDir,'news-feed.json')),now});
 if(!validateMarketSessions(merged.snapshot)||!validateMarketOverview(market))throw Error('invalid-market-snapshots');
 if(write){
  await writeJsonAtomic(join(dataDir,'market-sessions.json'),merged.snapshot);await writeJsonAtomic(join(dataDir,'market-overview.json'),market);
  const site=await readJson(join(dataDir,'site-snapshot.json'));
  if(validateSiteSnapshot(site)){
   const summary={id:'market-overview',status:market.status,freshness:market.freshness,lastSuccessfulAt:market.lastSuccessfulAt,dataAsOf:market.dataAsOf,nextExpectedAt:market.nextExpectedAt,...(market.fallbackReason?{fallbackReason:market.fallbackReason}:{})};
   const updated=buildSiteSnapshot({attemptedAt:now,datasets:[...site.datasets.filter(d=>d.id!=='market-overview'),summary]});
   if(!validateSiteSnapshot(updated))throw Error('invalid-market-site-status');await writeJsonAtomic(join(dataDir,'site-snapshot.json'),updated);
  }
 }
 return {market,sessions:merged.snapshot,conflicts:merged.conflicts};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){updateMarketData().then(({market})=>process.stdout.write('Market update: '+market.status+'\n')).catch(error=>{console.error(error);process.exitCode=1;});}
