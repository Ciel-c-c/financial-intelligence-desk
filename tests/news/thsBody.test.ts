import {expect,it} from 'vitest';
import {fetchNewsSource} from '../../scripts/news/fetch-news-sources.mjs';
import {fetchFullArticle,toPublicEvidence} from '../../scripts/news/full-article.mjs';
import {readHtmlResponse} from '../../scripts/news/html-response.mjs';
const source={id:'ths',name:'同花顺财经',tier:'verified',publisherDomains:['news.10jqka.com.cn'],feedUrl:'https://news.10jqka.com.cn/today_list/index.shtml',homepageUrl:'https://news.10jqka.com.cn/',regions:['中国','全球'],defaultLanguage:'zh',enabled:true,verifiedAt:'2026-09-17',parser:'ths-index',articlePolicy:{pathPrefix:'/',bodyFormat:'ths-body',publicFullText:false}};
const url='https://news.10jqka.com.cn/20260917/c680013457.shtml',title='政策发布与经济传导';
const now='2026-09-17T09:00:00Z';
const index=`<li><span class="arc-title"><a title="${title}" href="${url.replace('https:','http:')}" class="news-link">${title}</a><span>09月17日 16:15</span></span><a class="arc-cont" href="${url}">摘要不是正文</a></li>`;
const text='政策变化影响融资与企业经营，具体传导需要观察政策落实和后续数据。'.repeat(8);
const body=(publisher='新华社',origin='https://www.news.cn/finance/example.htm')=>`<h1>${title}</h1><span>2026-09-17 16:15:05</span><div>来源：<a href="${origin}">${publisher}</a></div><div class="news-content-parsed"><p>${text}</p><p>后续需要观察实际效果。</p></div></div></div><span>免责声明：不属于正文</span>`;
it('discovers a THS article and reads a complete body with verified upstream attribution',async()=>{
 const result=await fetchNewsSource(source,now,async request=>({ok:true,status:200,url:request,text:async()=>request===source.feedUrl?index:body()}));
 expect(result.ok).toBe(true);
 expect(result.items[0].canonicalUrl).toBe(url);
 expect(result.items[0].article?.text).toContain('后续需要观察实际效果。');
 expect(result.items[0].article?.text).not.toContain('免责声明');
 expect(result.items[0].article?.upstreamPublisher).toBe('新华社');
});
it('rejects a body from an unknown publisher or misleading publisher link',async()=>{
 for(const html of [body('个人博客','https://blog.test/a'),body('新华社','https://fake.test/a')]) {
  expect(await fetchFullArticle({canonicalUrl:url,originalTitle:title},source,now,async()=>({ok:true,url,text:async()=>html}))).toBeUndefined();
 }
});
it('rejects a truncated THS article without its closing body boundary',async()=>{
 const html=body().split('</div></div></div>')[0];
 expect(await fetchFullArticle({canonicalUrl:url,originalTitle:title},source,now,async()=>({ok:true,url,text:async()=>html}))).toBeUndefined();
});
it('does not publicly reprint a THS body used for analysis',()=>{
 expect(toPublicEvidence({article:{reader:'ths-body',text,sha256:'a'.repeat(64)}}).article.text).toBeUndefined();
});
it('decodes GBK bytes instead of replacing Chinese characters with mojibake',async()=>{
 const bytes=Uint8Array.from([0xd6,0xd0,0xce,0xc4]);
 expect(await readHtmlResponse({headers:{get:()=> 'text/html; charset=gbk'},arrayBuffer:async()=>bytes.buffer})).toBe('中文');
});
