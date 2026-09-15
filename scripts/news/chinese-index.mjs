const clean=value=>value.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function parseChineseIndex(html,source,fetchedAt){
 const blocks=html.split(/<div\b[^>]*class=["']ui-zxlist-item["'][^>]*>/i).slice(1);
 return blocks.map(block=>{
   const link=block.match(/<h3\b[^>]*>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
   const time=block.match(/class=["']ui-publish["'][^>]*>\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i)?.[1];
   if(!link||!time) return undefined;
   const url=new URL(link[1],source.feedUrl);
   if(url.protocol!=='https:'||!source.publisherDomains.includes(url.hostname)||!url.pathname.startsWith(source.articlePolicy.pathPrefix)) return undefined;
   return {sourceId:source.id,sourceName:source.name,sourceTier:source.tier,sourceUrl:url.toString(),canonicalUrl:url.toString(),originalLanguage:'zh',originalTitle:clean(link[2]),publishedAt:new Date(time.replace(' ','T')+'+08:00').toISOString(),fetchedAt};
 }).filter(Boolean);
}
