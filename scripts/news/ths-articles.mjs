const clean=value=>value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function parseThsIndex(html,source,fetchedAt) {
 const items=[];
 for(const block of html.split(/<li\b[^>]*>/i).slice(1)) {
  const header=block.match(/<span\b[^>]*class=["']arc-title["'][^>]*>([\s\S]*?)<\/li>/i)?.[1];
  if(!header) continue;
  const link=header.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const clock=header.match(/(\d{2})月(\d{2})日\s+(\d{2}:\d{2})/);
  if(!link||!clock) continue;
  let url;try{url=new URL(link[1],source.feedUrl);}catch{continue;}
  if(!['http:','https:'].includes(url.protocol)||url.hostname!=='news.10jqka.com.cn'||url.search||url.hash) continue;
  const date=url.pathname.match(/^\/(\d{4})(\d{2})(\d{2})\/c\d+\.shtml$/);
  if(!date||date[2]!==clock[1]||date[3]!==clock[2]) continue;
  url.protocol='https:';
  const publishedAt=new Date(`${date[1]}-${date[2]}-${date[3]}T${clock[3]}:00+08:00`).toISOString();
  if(Date.parse(publishedAt)>Date.parse(fetchedAt)) continue;
  if(items.some(item=>item.canonicalUrl===url.toString())) continue;
  items.push({sourceId:source.id,sourceName:source.name,sourceTier:source.tier,sourceUrl:url.toString(),canonicalUrl:url.toString(),originalLanguage:'zh',originalTitle:clean(link[2]),publishedAt,fetchedAt});
 }
 return items;
}
export function thsAttribution(html) {
 const match=html.match(/来源：\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
 if(!match) return undefined;
 const name=clean(match[2]);let url;try{url=new URL(match[1]);}catch{return undefined;}
 const domains={'新华社':['news.cn','xinhuanet.com'],'新华财经':['cnfin.com'],'央视新闻':['cctv.com'],'人民日报':['people.com.cn'],'证券时报':['stcn.com'],'中国证券报':['cs.com.cn'],'第一财经':['yicai.com'],'同花顺财经':['10jqka.com.cn']};
 if(url.protocol!=='https:'||!(domains[name]??[]).some(domain=>url.hostname===domain||url.hostname.endsWith(`.${domain}`))) return undefined;
 return {upstreamPublisher:name,upstreamUrl:url.toString()};
}
