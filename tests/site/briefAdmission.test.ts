import { expect,it } from 'vitest';
import { selectBriefNews } from '../../scripts/update-site-data.mjs';
import reviewed from '../fixtures/reviewed-news.json';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
const nativeEnglish=(id:string,title:string,summary:string,date:string)=>{
 const r:any=prepareNewsEvidence({id,sourceId:'bbc-business',sourceTier:'verified',originalLanguage:'en',originalTitle:title,originalSummary:summary,canonicalUrl:`https://www.bbc.co.uk/news/articles/${id}`,publishedAt:date,fetchedAt:date});
 r.factualSummary={language:'en',originalTitle:title,title,summary,sourceUrl:r.canonicalUrl,publishedAt:date,sourceHash:r.article.sha256,evidenceScope:'summary',reviewVersion:'factual-v1',checkedAt:date,origin:'publisher-en',evidence:[]};return r;
};
it('puts economically important facts before newer unrelated publisher summaries',()=>{
 const economy=nativeEnglish('economy','GDP growth slows','Officials reported slower GDP growth. The report described economic conditions and provided the latest figures for the quarter.','2026-10-09T13:00:00Z');
 const museum=nativeEnglish('museum','A town opens a museum','Local residents attended the opening of a new museum. The exhibition features artwork and photographs from the history of the town.','2026-10-09T13:59:00Z');
 expect(selectBriefNews({latest:[museum,economy]},'2026-10-09T14:00:00Z').map(r=>r.id)).toEqual(['economy','museum']);
});
it('keeps a valid source summary but removes an unpublishable cached interpretation from brief inputs',()=>{
 const r=nativeEnglish('summary','GDP report released','Officials released a GDP report covering the latest quarter. The publication described economic conditions and the latest available figures.','2026-10-09T13:00:00Z');
 r.editorial={item:{title:'Unreviewed interpretation',facts:['An unsupported consequence']}};
 const selected=selectBriefNews({latest:[r]},'2026-10-09T14:00:00Z');expect(selected).toHaveLength(1);expect(selected[0].editorial).toBeUndefined();expect(r.editorial).toBeDefined();
});
it('includes factual-only news without treating it as a complete interpretation',()=>{
 const date='2026-10-09T14:00:00Z',title='联合国发布经济与就业报告',summary='联合国发布经济与就业报告，介绍冲突与经济变化对家庭生活及就业的影响。报告强调公共服务和政策落实的重要性，后续改善仍需要结合当地条件判断，不能从单条新闻推断所有资产的涨跌。';
 const item=prepareNewsEvidence({id:'summary-only',sourceId:'un-zh',sourceTier:'official',originalLanguage:'zh',originalTitle:title,originalSummary:summary,canonicalUrl:'https://news.un.org/feed/view/zh/story/2026/10/1142960',publishedAt:date,fetchedAt:date});
 item.factualSummary={language:'zh',originalTitle:title,title,summary,sourceUrl:item.canonicalUrl,publishedAt:date,sourceHash:item.article.sha256,evidenceScope:'summary',reviewVersion:'factual-v1',checkedAt:date,origin:'publisher-zh',evidence:[]};
 expect(selectBriefNews({latest:[item]},date).map(i=>i.id)).toEqual(['summary-only']);
});
it('includes audited source-summary analyses in the clickable daily brief',()=>{
 const date='2026-09-15T08:00:00Z',summary='来源提供了明确事件事实，后续影响需要观察政策落实、需求与成本，而不能保证股价方向。'.repeat(3);
 const base=reviewed.items[0],text=base.originalTitle+'\n'+summary,hash=articleHash(text);
 const item={...base,originalSummary:summary,publishedAt:date,article:{...base.article,status:'summary',text,reader:'publisher-feed-summary',sha256:hash},editorial:{...base.editorial,evidenceScope:'summary',sourceBodyHash:hash,item:{...base.editorial.item,publishedAt:date}}};
 expect(selectBriefNews({latest:[item]},'2026-09-15T09:00:00Z').map(i=>i.id)).toEqual(['ecb-energy-rate-hike']);
});
it('selects only complete corresponding Chinese analyses, not raw headlines, for daily briefs',()=>{
 const date='2026-09-15T08:00:00Z';const item={...reviewed.items[0],publishedAt:date,editorial:{...reviewed.items[0].editorial,item:{...reviewed.items[0].editorial.item,publishedAt:date}}};
 const raw={...item,id:'raw',article:undefined,editorial:undefined};
 const mismatched={...item,id:'mismatched',titleZh:'错误中文标题'};
 const result=selectBriefNews({latest:[raw,mismatched,item]},'2026-09-15T09:00:00Z');
 expect(result.map(record=>record.id)).toEqual(['ecb-energy-rate-hike']);
});
it('does not promote a withheld gross-to-net liquidity interpretation into the brief',()=>{
 const date='2026-09-15T08:00:00Z',base=reviewed.items[0];
 const item={...base,publishedAt:date,editorial:{...base.editorial,evidence:{facts:[{text:'当日净回笼。',evidence:'开展6060亿元逆回购，当日净回笼4085亿元。'}]},item:{...base.editorial.item,publishedAt:date,causalChain:[{title:'逆回购操作',explanation:'开展6060亿元逆回购。',condition:'操作持续'},{title:'资金增加',explanation:'银行体系可用资金增多。',condition:'需求稳定'},{title:'利率变化',explanation:'利率可能变化。',condition:'其他条件不变'}]}}};
 expect(selectBriefNews({latest:[item]},'2026-09-15T09:00:00Z')).toEqual([]);
});
