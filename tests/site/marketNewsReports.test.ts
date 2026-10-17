import {expect,it} from 'vitest';
import * as reports from '../../scripts/site/market-fetch.mjs';
import {newsSources} from '../../scripts/news/source-registry.mjs';
import {articleHash} from '../../scripts/news/full-article.mjs';
const now='2026-10-16T12:00:00Z',source=newsSources.find(s=>s.id==='cnfin');
const text='2026年10月16日，上证指数收于3,000.12点，涨0.20%。这是用于检验数据通道的合成报道，不是真实行情。本文明确列出交易日期及收盘数值，不能作为实际市场报价发布。';
const record={sourceId:'cnfin',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20261016/12345_1.html',publishedAt:'2026-10-16T08:00:00Z',originalTitle:'合成收盘报道',article:{status:'complete',text,sha256:articleHash(text)}};
it('extracts only explicit reported closes from approved original body evidence',()=>{
 expect(reports.marketObservationsFromNews?.([record],source,now)?.[0]).toMatchObject({id:'sse-composite',value:3000.12,tradingDate:'2026-10-16',provenance:'report',session:'close'});
});
it('discovers a later-page New York close without filling the body budget only with A-share reports',async()=>{
 const title='【环球财经】纽约股市三大股指15日均上涨',url='https://www.cnfin.com/gs-lb/detail/20261016/90000_1.html';
 const body='新华财经纽约10月15日电 美国纽约股市三大股指15日收盘时均上涨。截至当天收盘，道琼斯工业平均指数上涨500点，收于50000.12点，涨幅为1.00%；标准普尔500种股票指数上涨20点，收于7000.34点，涨幅为0.30%；纳斯达克综合指数上涨10点，收于25000.56点，涨幅为0.04%。以上为合成回归数据，不是真实行情。';
 const link=(title,url,time)=>`<div class="ui-zxlist-item"><h3><a href="${url}">${title}</a></h3><span class="ui-publish">${time}</span></div>`;
 const requests:string[]=[];
 const rows=await reports.fetchMarketReportSources({now,fetchImpl:async target=>{
  const address=String(target);requests.push(address);
  if(address===url)return new Response(`<h1>${title}</h1><div class="xhcj_detail_main"><p>${body}</p><p class="app-statement">声明</p></div>`);
  if(address.endsWith('index_4.shtml'))return new Response(link(title,url,'2026-10-16 06:52:13'));
  return new Response(Array.from({length:8},(_,i)=>link('收评：合成A股'+i,`https://www.cnfin.com/gs-lb/detail/20261016/${10000+i}_1.html`,'2026-10-16 16:00:00')).join(''));
 }});
 expect(rows.find(row=>row.market==='us')).toMatchObject({status:'ok',instruments:expect.arrayContaining([expect.objectContaining({id:'sp500',value:7000.34,tradingDate:'2026-10-15'})])});
 expect(requests.filter(url=>url.includes('/gs-lb/detail/')).length).toBeLessThanOrEqual(6);
 expect(requests.filter(url=>url.includes('/in/stockdata/')).length).toBeLessThanOrEqual(6);
});
it('does not promote summaries, generated analysis, altered bodies or another publisher into quotes',()=>{
 for(const item of [{...record,article:{...record.article,status:'summary'}},{...record,article:{...record.article,text:text+'changed'}},{...record,sourceId:'bbc-world'},{...record,article:undefined,editorial:{item:{facts:[text]}}}])
  expect(reports.marketObservationsFromNews?.([item],source,now)).toEqual([]);
});
it('retains verified reports when a later discovery page fails',async()=>{
 const title='收评：合成收盘测试',url='https://www.cnfin.com/gs-lb/detail/20261016/12345_1.html';
 const body='新华财经北京10月16日电 沪深两市主要股指16日早间高开，盘中市场有所分化。截至收盘，上证指数报3000.12点，涨幅0.20%；深证成指报10000.34点，跌幅0.10%；创业板指报2000.56点，跌幅0.30%。这是合成回归测试，不是真实交易行情，不可作为市场数据对外发布。';
 const index=`<div class="ui-zxlist-item"><h3><a href="${url}">${title}</a></h3><span class="ui-publish">2026-10-16 16:00:00</span></div>`;
 const requests:string[]=[];
 const result=await reports.fetchMarketReportSources({now,fetchImpl:async target=>{
  requests.push(String(target));
  if(String(target).endsWith('index_3.shtml'))return new Response('',{status:503});
  const html=String(target)===url?`<h1>${title}</h1><div class="xhcj_detail_main"><p>${body}</p><p class="app-statement">声明</p></div>`:index;
  return new Response(html,{headers:{'content-type':'text/html;charset=utf-8'}});
 }});
 expect(result.find(row=>row.market==='aShare')).toMatchObject({status:'ok',instruments:expect.arrayContaining([expect.objectContaining({id:'sse-composite',value:3000.12})])});
 expect(requests.filter(request=>request===url)).toHaveLength(1);
 expect(requests).toContain('https://www.cnfin.com/in/stockdata/index_2.shtml');
});
