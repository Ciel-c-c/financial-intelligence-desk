import { expect,it } from 'vitest';
import { selectBriefNews } from '../../scripts/update-site-data.mjs';
import reviewed from '../fixtures/reviewed-news.json';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
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
