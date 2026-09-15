export const newsSources = [
  {id:'cnfin',name:'新华财经',tier:'verified',publisherDomains:['www.cnfin.com','cnfin.com'],feedUrl:'https://www.cnfin.com/news/index.html',homepageUrl:'https://www.cnfin.com/',regions:['中国','全球'],defaultLanguage:'zh',enabled:true,verifiedAt:'2026-09-15',parser:'html-index',verificationUrl:'https://www.cnfin.com/news/index.html',usagePolicy:'original-analysis-and-source-link-no-full-reprint',contentScope:'body-read-no-reprint',articlePolicy:{pathPrefix:'/yw-lb/detail/',bodyFormat:'cnfin-body',publicFullText:false}},
  { id:'nbs-cn', name:'国家统计局', tier:'official', publisherDomains:['stats.gov.cn','www.stats.gov.cn'], feedUrl:'https://www.stats.gov.cn/sj/zxfb/rss.xml', homepageUrl:'https://www.stats.gov.cn/', regions:['中国'], defaultLanguage:'zh', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'fed', name:'Federal Reserve', tier:'official', publisherDomains:['federalreserve.gov','www.federalreserve.gov'], feedUrl:'https://www.federalreserve.gov/feeds/press_all.xml', homepageUrl:'https://www.federalreserve.gov/', regions:['美国','全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'ecb', name:'European Central Bank', tier:'official', publisherDomains:['ecb.europa.eu','www.ecb.europa.eu'], feedUrl:'https://www.ecb.europa.eu/rss/press.html', homepageUrl:'https://www.ecb.europa.eu/', regions:['欧洲','全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss', articlePolicy:{pathPrefix:'/press/pr/',bodyFormat:'ecb-section',permissionUrl:'https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html'} },
  { id:'boj', name:'Bank of Japan', tier:'official', publisherDomains:['boj.or.jp','www.boj.or.jp'], feedUrl:'https://www.boj.or.jp/en/rss/whatsnew.xml', homepageUrl:'https://www.boj.or.jp/en/', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'un', name:'UN News', tier:'official', publisherDomains:['news.un.org'], feedUrl:'https://news.un.org/feed/subscribe/en/news/all/rss.xml', homepageUrl:'https://news.un.org/', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-14', parser:'rss' },
  { id:'bbc-world', name:'BBC News · 世界', tier:'verified', publisherDomains:['bbc.com','bbc.co.uk'], feedDomains:['feeds.bbci.co.uk'], feedUrl:'https://feeds.bbci.co.uk/news/world/rss.xml', homepageUrl:'https://www.bbc.com/news/world', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-15', parser:'rss', verificationUrl:'https://support.bbc.co.uk/platform/feeds/NewsFeeds.htm', usageTermsUrl:'https://downloads.bbc.co.uk/usingthebbc/bbc_terms_of_use_31March2022english.pdf', usagePolicy:'noncommercial-rss-only', contentScope:'feed-only' },
  { id:'bbc-business', name:'BBC News · 财经', tier:'verified', publisherDomains:['bbc.com','bbc.co.uk'], feedDomains:['feeds.bbci.co.uk'], feedUrl:'https://feeds.bbci.co.uk/news/business/rss.xml', homepageUrl:'https://www.bbc.com/news/business', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-15', parser:'rss', verificationUrl:'https://support.bbc.co.uk/platform/feeds/NewsFeeds.htm', usageTermsUrl:'https://downloads.bbc.co.uk/usingthebbc/bbc_terms_of_use_31March2022english.pdf', usagePolicy:'noncommercial-rss-only', contentScope:'feed-only' },
  { id:'bis-press', name:'Bank for International Settlements', tier:'official', publisherDomains:['bis.org'], feedUrl:'https://www.bis.org/doclist/all_pressrels.rss', homepageUrl:'https://www.bis.org/', regions:['全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-15', parser:'rss', verificationUrl:'https://www.bis.org/rss', usageTermsUrl:'https://www.bis.org/about/terms-conditions', usagePolicy:'noncommercial-rss-only', contentScope:'feed-only' },
  { id:'eia-energy', name:'U.S. Energy Information Administration', tier:'official', publisherDomains:['eia.gov'], feedUrl:'https://www.eia.gov/rss/todayinenergy.xml', homepageUrl:'https://www.eia.gov/', regions:['美国','全球'], defaultLanguage:'en', enabled:true, verifiedAt:'2026-09-15', parser:'rss', verificationUrl:'https://www.eia.gov/tools/rssfeeds/', usageTermsUrl:'https://www.eia.gov/about/copyrights_reuse.php', usagePolicy:'public-domain-text-with-attribution', contentScope:'feed-only' },
];

// Body-only sources: verified original articles can be reviewed and refreshed;
// this does not pretend their news listing already has an automatic adapter.
export const articleSources=[
 {id:'yicai',name:'第一财经',tier:'verified',publisherDomains:['www.yicai.com'],homepageUrl:'https://www.yicai.com/',verificationUrl:'https://www.yicai.com/others/aboutus.html',verifiedAt:'2026-09-15',usageTermsUrl:'https://www.yicai.com/news/103153967.html',contentScope:'body-read-no-reprint',articlePolicy:{pathPrefix:'/news/',bodyFormat:'yicai-body',publicFullText:false}}
];

// Identity verified; ingestion endpoints still need separate validation.
export const pendingNewsSources = [
  { id:'rba', name:'Reserve Bank of Australia', homepageUrl:'https://www.rba.gov.au/', verificationUrl:'https://www.rba.gov.au/rss/', usageTermsUrl:'https://www.rba.gov.au/copyright/', enabled:false, verifiedAt:'2026-09-15', reason:'官方新闻稿 RSS 在本次访问中返回 403，不绕过访问限制。' },
  { id:'xinhua', name:'新华社', homepageUrl:'https://www.news.cn/', verificationUrl:'https://english.news.cn/rss/', enabled:false, verifiedAt:'2026-09-15', reason:'RSS 目录存在；当前有效免费接口及公开展示许可尚未完成验证。' },
  { id:'afp', name:'法新社', homepageUrl:'https://www.afp.com/', enabled:false, verifiedAt:'2026-09-15', reason:'未验证可免费公开展示的订阅接口；不使用付费供稿或第三方转载冒充原始来源。' },
  { id:'reuters', name:'路透社', homepageUrl:'https://www.reuters.com/', enabled:false, verifiedAt:'2026-09-15', reason:'未验证可免费公开展示的订阅接口。' },
  { id:'ap', name:'美联社', homepageUrl:'https://apnews.com/', enabled:false, verifiedAt:'2026-09-15', reason:'未验证可免费公开展示的订阅接口。' },
];

export function validateRegisteredSource(source, now = new Date().toISOString()) {
  try {
    const urls = [new URL(source.feedUrl), new URL(source.homepageUrl)];
    const age = Date.parse(now) - Date.parse(`${source.verifiedAt}T00:00:00Z`);
    const matchesDomain = (host, domains) => domains.some(domain => host === domain || host.endsWith(`.${domain}`));
    return typeof source.id === 'string' && typeof source.name === 'string' && ['official','verified'].includes(source.tier)
      && source.enabled === true && urls.every(url => url.protocol === 'https:') && Array.isArray(source.publisherDomains) && source.publisherDomains.length > 0
      && matchesDomain(urls[0].hostname, source.feedDomains ?? source.publisherDomains) && matchesDomain(urls[1].hostname, source.publisherDomains)
      && Array.isArray(source.regions) && source.regions.length > 0 && ['rss','atom','html-index'].includes(source.parser) && age >= 0 && age <= 90 * 86400_000;
  } catch { return false; }
}
