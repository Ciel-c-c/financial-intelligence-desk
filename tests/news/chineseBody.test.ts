import { expect,it } from 'vitest';
import { fetchNewsSource } from '../../scripts/news/fetch-news-sources.mjs';
const source={id:'cnfin',name:'新华财经',tier:'verified',publisherDomains:['www.cnfin.com','cnfin.com'],feedUrl:'https://www.cnfin.com/news/index.html',homepageUrl:'https://www.cnfin.com/',regions:['中国'],defaultLanguage:'zh',enabled:true,verifiedAt:'2026-09-15',parser:'html-index',articlePolicy:{pathPrefix:'/yw-lb/detail/',bodyFormat:'cnfin-body',publicFullText:false}};
const url='https://www.cnfin.com/yw-lb/detail/20260915/a_1.html';
const title='两部门对在线酒店预订平台服务行业开展行政指导';
const index=`<div class="ui-zxlist-item"><h3><a href="${url}">${title}</a></h3><div class="ui-publish">2026-09-15 16:04:32</div></div>`;
const paragraph='监管部门要求在线酒店预订平台落实合规主体责任，加强公平竞争与消费者权益保护。'.repeat(5);
it('discovers Chinese news with actual dates and reads the full body',async()=>{
 const result=await fetchNewsSource(source,'2026-09-15T09:00:00Z',async request=>({ok:true,status:200,url:request,text:async()=>request===source.feedUrl?index:`<h1>${title}</h1><div class="xhcj_detail_main"><p>${paragraph}</p><p>编辑：测试</p><p class="app-statement">声明</p></div>`}));
 expect(result.ok).toBe(true);
 expect(result.items[0].publishedAt).toBe('2026-09-15T08:04:32.000Z');
 expect(result.items[0].article.status).toBe('complete');
 expect(result.items[0].originalLanguage).toBe('zh');
});
