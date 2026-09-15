import { expect, it } from 'vitest';
import { fetchNewsSource } from '../../scripts/news/fetch-news-sources.mjs';
const source={id:'ecb',name:'ECB',tier:'official',publisherDomains:['ecb.europa.eu'],feedUrl:'https://www.ecb.europa.eu/rss/press.html',homepageUrl:'https://www.ecb.europa.eu/',regions:['欧洲'],defaultLanguage:'en',enabled:true,verifiedAt:'2026-09-15',parser:'rss',articlePolicy:{pathPrefix:'/press/pr/',bodyFormat:'ecb-section'}};
const title='Monetary policy decisions';
const url='https://www.ecb.europa.eu/press/pr/date/2026/html/policy.en.html';
const feed=`<rss><item><title>${title}</title><link>${url}</link><pubDate>15 Sep 2026 12:00:00 GMT</pubDate><description>A short summary.</description></item></rss>`;
const paragraph='The Governing Council has made a policy decision. This is an official statement explaining the economic outlook, the inflation assessment and the conditions governing the next decision. These statements concern future policy and do not imply guaranteed asset returns.';
const html=`<html><main><h1>${title}</h1><div class="section"><p>${paragraph}</p><p>${paragraph} Additional closing assessment.</p></div></main></html>`;
it('reads a complete permitted official body, not its RSS summary',async()=>{
 const result=await fetchNewsSource(source,'2026-09-15T14:00:00Z',async request=>({ok:true,status:200,url:request,text:async()=>request===source.feedUrl?feed:html}));
 expect(result.items[0].article?.status).toBe('complete');
 expect(result.items[0].article?.text).toContain('Additional closing assessment.');
 expect(result.items[0].article?.sourceUrl).toBe(url);
});
it('does not mark a paywall or mismatched article as complete',async()=>{
 const result=await fetchNewsSource(source,'2026-09-15T14:00:00Z',async request=>({ok:true,status:200,url:request,text:async()=>request===source.feedUrl?feed:html.replace(title,'A different event')}));
 expect(result.items[0].article).toBeUndefined();
});
