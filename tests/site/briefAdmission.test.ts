import { expect,it } from 'vitest';
import { selectBriefNews } from '../../scripts/update-site-data.mjs';
import reviewed from '../fixtures/reviewed-news.json';
import {articleHash} from '../../scripts/news/full-article.mjs';
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
