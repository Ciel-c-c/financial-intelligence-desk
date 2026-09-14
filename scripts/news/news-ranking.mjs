export function scoreNewsItem(item, now) { const age=Math.max(0,(Date.parse(now)-Date.parse(item.publishedAt))/3600_000); return item.importanceScore+Math.max(0,24-age)+(item.verificationStatus==='cross-checked'?8:0); }
export function selectNewsWindows(items, now) {
  const age=item=>(Date.parse(now)-Date.parse(item.publishedAt))/3600_000;
  const sort=(a,b)=>scoreNewsItem(b,now)-scoreNewsItem(a,now)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt);
  const latest=items.filter(item=>age(item)>=0&&age(item)<=24).sort(sort);
  const continuing=items.filter(item=>age(item)>24&&age(item)<=72&&item.continuingImpactScore>=60&&item.causalSignals.length>0).sort(sort).slice(0,6);
  return {latest,continuing};
}
