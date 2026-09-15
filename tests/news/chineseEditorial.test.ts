import { expect,it } from 'vitest';
import { reviewChineseArticle } from '../../scripts/news/chinese-editorial.mjs';
import { articleHash } from '../../scripts/news/full-article.mjs';
import { buildNewsSnapshot } from '../../scripts/news/update-news-feed.mjs';
const text='市场监管总局会同文化和旅游部召开在线酒店预订平台服务行业行政指导会。要求平台企业严格落实合规主体责任，坚持公平竞争，对照自查，防范独家合作、“全网最低价”等竞争风险。'.repeat(3);
const item={id:'policy',originalTitle:'两部门对在线酒店预订平台服务行业开展行政指导',originalLanguage:'zh',sourceName:'新华财经',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20260915/4470116_1.html',publishedAt:'2026-09-15T08:04:32Z',article:{status:'complete',reader:'cnfin-body',text,sha256:articleHash(text),checkedAt:'2026-09-15T13:00:00Z'}};
it('derives policy interpretation from a complete matching body and binds every section to it',()=>{
 const result=reviewChineseArticle(item);
 expect(result.editorial.sourceBodyHash).toBe(item.article.sha256);
 expect(result.editorial.political.newsId).toBe('policy');
 expect(result.editorial.item.facts.join('')).toContain('行政指导');
 expect(result.editorial.soWhat.personalImpact.map(p=>p.label)).toEqual(['消费','企业经营']);
 expect(result.editorial.item.risks.join('')).toContain('不等于');
});
it('does not manufacture analysis from a headline or a tampered body',()=>{
 expect(reviewChineseArticle({...item,article:undefined})).toEqual({...item,article:undefined});
 const changed={...item,article:{...item.article,text:'标题相同但正文是其他事件'}};
 expect(reviewChineseArticle(changed)).toEqual(changed);
});
it('publishes reviewed Chinese analysis through the actual update pipeline without reprinting the body',async()=>{
 const raw={...item,sourceId:'cnfin',sourceTier:'verified',sourceUrl:item.canonicalUrl,fetchedAt:'2026-09-15T13:00:00Z'};
 const snapshot=await buildNewsSnapshot({now:'2026-09-15T13:00:00Z',sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[raw]}]});
 expect(snapshot.latest[0].editorial.item.facts.join('')).toContain('行政指导');
 expect(snapshot.latest[0].article.text).toBeUndefined();
 expect(snapshot.latest[0].summaryZh).toContain('不');
});
it('explains a verified shipping-to-fertilizer-to-food chain without reusing the oil story',()=>{
 const foodBody='粮农组织驻俄罗斯联邦联络处主管接受俄媒采访。霍尔木兹海峡航运受阻，化肥供应延迟数周，可能错过最佳施肥时间，最终导致粮食减产。尿素等化肥产品通过海峡进入全球市场。'.repeat(3);
 const food={...item,originalTitle:'粮农组织：霍尔木兹海峡航运受阻影响全球粮食生产',article:{...item.article,text:foodBody,sha256:articleHash(foodBody)}};
 const result=reviewChineseArticle(food);
 expect(result.editorial.item.region).toBe('全球');
 expect(result.editorial.soWhat.next).toEqual(['海峡运输受阻','化肥可能延迟','错过施肥窗口','粮食供给可能减少']);
 expect(result.editorial.item.facts.join('')).toContain('引述');
 expect(result.editorial.item.risks.join('')).toContain('预测');
 expect(result.editorial.soWhat.personalImpact.map(p=>p.label)).toEqual(['消费','企业经营']);
});
it('separates reported chip share prices from uncertain future AI spending',()=>{
 const aiBody='英伟达(NVDA.O)股价跌3.36%，博通跌4.77%。Anthropic讨论AI安全，资本支出是否减少仍有不确定性，芯片需求可能受影响。'.repeat(10);
 const ai={...item,originalTitle:'“AI减速论”砸向芯片股，英伟达市值一夜蒸发超1700亿美元',article:{...item.article,reader:'yicai-body',text:aiBody,sha256:articleHash(aiBody)}};
 const result=reviewChineseArticle(ai);
 expect(result.editorial.item.facts.join('')).toContain('3.36%');
 expect(result.editorial.item.risks.join('')).toContain('订单');
 expect(result.editorial.soWhat.personalImpact.map(p=>p.label)).toEqual(['投资','企业经营','工作']);
});
