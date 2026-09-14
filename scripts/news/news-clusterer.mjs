export function clusterNewsItems(items) {
  const groups=new Map(); for(const item of items){ const key=item.clusterId; const group=groups.get(key)??[]; group.push(item); groups.set(key,group); }
  return [...groups.values()].map(group=>{ const sorted=[...group].sort((a,b)=>(a.sourceTier==='official'?-1:1)-(b.sourceTier==='official'?-1:1)); const primary=sorted[0]; const related=sorted.slice(1).map(item=>({name:item.sourceName,url:item.canonicalUrl,publishedAt:item.publishedAt})); return {...primary,relatedSources:related,verificationStatus:group.length>1?'cross-checked':primary.verificationStatus}; });
}
