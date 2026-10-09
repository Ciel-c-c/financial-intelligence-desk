import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {newsSources,validateRegisteredSource} from './source-registry.mjs';
export {isSourceAllowed} from '../../src/data/factualSummaryValidation.mjs';
const paths={
 'un-zh':['^/(?:feed/view/)?zh/story/[0-9]{4}/[0-9]{2}/[0-9]+/?$'],
 un:['^/(?:feed/view/)?en/story/[0-9]{4}/[0-9]{2}/[0-9]+/?$'],
 'cnbc-markets':['^/[0-9]{4}/[0-9]{2}/[0-9]{2}/[^/]+\\.html$'],
 'cnbc-business':['^/[0-9]{4}/[0-9]{2}/[0-9]{2}/[^/]+\\.html$'],
 cnfin:['^/yw-lb/detail/[0-9]{8}/[0-9]+_1\\.html$'],
 'bbc-world':['^/news/(?:articles|videos)/[a-z0-9]+/?$','^/news/[a-z-]+-[0-9]+/?$'],
 'bbc-business':['^/news/(?:articles|videos)/[a-z0-9]+/?$','^/news/[a-z-]+-[0-9]+/?$'],
 'bis-press':['^/press/p[0-9]+(?:[a-z])?\\.htm$'],
 'eia-energy':['^/todayinenergy/detail\\.php$'],
};
const modes={
 'source-summary-with-attribution-and-link-no-full-reprint':'publisher',
 'noncommercial-rss-only':'publisher',
 'public-domain-text-with-attribution':'publisher',
 'original-summary-analysis-with-source-link':'model-only',
 'original-analysis-and-source-link-no-full-reprint':'model-only',
};
export function buildSourcePolicies(sources,now){
 return sources.filter(source=>validateRegisteredSource(source,now)&&modes[source.usagePolicy]&&paths[source.id]).map(source=>({
  id:source.id,tier:source.tier,allowedHosts:[...new Set(source.publisherDomains.flatMap(host=>host.startsWith('www.')?[host,host.slice(4)]:[host,`www.${host}`]))].sort(),
  allowedPathPatterns:paths[source.id],summaryMode:modes[source.usagePolicy],verifiedAt:`${source.verifiedAt}T00:00:00.000Z`,expiresAt:new Date(Date.parse(`${source.verifiedAt}T00:00:00Z`)+90*86400_000).toISOString(),
 }));
}
export function renderSourcePolicies(policies){return '// Generated from scripts/news/source-registry.mjs; do not edit.\nexport const newsSourcePolicies = '+JSON.stringify(policies,null,2)+' as const;\n';}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 // Stable generation date prevents unrelated builds from silently expiring a
 // committed policy. Runtime admission checks actual validity dates.
 const reviewed=newsSources.filter(s=>s.enabled).map(s=>s.verifiedAt).sort().at(-1);
 const content=renderSourcePolicies(buildSourcePolicies(newsSources,`${reviewed}T23:59:59Z`)),target=resolve('src/data/newsSourcePolicy.generated.ts');
 if(process.argv.includes('--check')){
  if(await readFile(target,'utf8').catch(()=>undefined)!==content){console.error('Source publication policy is stale; run npm run sources:generate');process.exitCode=1;}
 }else await writeFile(target,content,'utf8');
}
