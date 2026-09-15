const decode = (value='') => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const field = (block, names) => names.map(name => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]).find(Boolean);
const atomLink = block => block.match(/<link[^>]+href=['"]([^'"]+)['"]/i)?.[1];
const allowed = (url, domains) => { try { const host = new URL(url).hostname.toLowerCase(); return domains.some(domain => host === domain || host.endsWith(`.${domain}`)); } catch { return false; } };

export function parseNewsFeed(xml, source, fetchedAt) {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map(match => match[2]);
  return blocks.map(block => {
    const originalTitle = decode(field(block,['title']));
    const rawUrl = decode(field(block,['link','guid'])) || atomLink(block);
    const rawDate = decode(field(block,['pubDate','published','updated','dc:date']));
    const published = Date.parse(rawDate);
    if (!originalTitle || !rawUrl || !Number.isFinite(published) || !allowed(rawUrl, source.publisherDomains)) return undefined;
    const parsedUrl=new URL(rawUrl); if(parsedUrl.protocol==='http:') parsedUrl.protocol='https:'; parsedUrl.pathname=parsedUrl.pathname.replace(/\/{2,}/g,'/'); const canonicalUrl=parsedUrl.toString();
    const summary = decode(field(block,['description','summary','content']));
    return { sourceId:source.id, sourceName:source.name, sourceTier:source.tier, sourceUrl:source.feedUrl, canonicalUrl, originalLanguage:source.defaultLanguage, originalTitle, originalSummary:summary || undefined, publishedAt:new Date(published).toISOString(), fetchedAt };
  }).filter(Boolean);
}
