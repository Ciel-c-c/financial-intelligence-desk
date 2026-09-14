export const newsSources = [
  { id:'nbs-cn', name:'国家统计局', tier:'official', publisherDomains:['stats.gov.cn','www.stats.gov.cn'], feedUrl:'https://www.stats.gov.cn/sj/zxfb/rss.xml', homepageUrl:'https://www.stats.gov.cn/', regions:['中国'], defaultLanguage:'zh', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'fed', name:'Federal Reserve', tier:'official', publisherDomains:['federalreserve.gov','www.federalreserve.gov'], feedUrl:'https://www.federalreserve.gov/feeds/press_all.xml', homepageUrl:'https://www.federalreserve.gov/', regions:['美国','全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'ecb', name:'European Central Bank', tier:'official', publisherDomains:['ecb.europa.eu','www.ecb.europa.eu'], feedUrl:'https://www.ecb.europa.eu/rss/press.html', homepageUrl:'https://www.ecb.europa.eu/', regions:['欧洲','全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'boj', name:'Bank of Japan', tier:'official', publisherDomains:['boj.or.jp','www.boj.or.jp'], feedUrl:'https://www.boj.or.jp/en/rss/whatsnew.xml', homepageUrl:'https://www.boj.or.jp/en/', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'un', name:'UN News', tier:'official', publisherDomains:['news.un.org'], feedUrl:'https://news.un.org/feed/subscribe/en/news/all/rss.xml', homepageUrl:'https://news.un.org/', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
];

export function validateRegisteredSource(source, now = new Date().toISOString()) {
  try {
    const urls = [new URL(source.feedUrl), new URL(source.homepageUrl)];
    const age = Date.parse(now) - Date.parse(`${source.verifiedAt}T00:00:00Z`);
    return typeof source.id === 'string' && typeof source.name === 'string' && ['official','verified'].includes(source.tier)
      && source.enabled === true && urls.every(url => url.protocol === 'https:') && Array.isArray(source.publisherDomains) && source.publisherDomains.length > 0
      && Array.isArray(source.regions) && source.regions.length > 0 && ['rss','atom'].includes(source.parser) && age >= 0 && age <= 90 * 86400_000;
  } catch { return false; }
}
