import { expect,it } from 'vitest';
import { selectBriefNews } from '../../scripts/update-site-data.mjs';
import reviewed from '../fixtures/reviewed-news.json';
it('selects only complete corresponding Chinese analyses, not raw headlines, for daily briefs',()=>{
 const date='2026-09-15T08:00:00Z';const item={...reviewed.items[0],publishedAt:date,editorial:{...reviewed.items[0].editorial,item:{...reviewed.items[0].editorial.item,publishedAt:date}}};
 const raw={...item,id:'raw',article:undefined,editorial:undefined};
 const mismatched={...item,id:'mismatched',titleZh:'错误中文标题'};
 const result=selectBriefNews({latest:[raw,mismatched,item]},'2026-09-15T09:00:00Z');
 expect(result.map(record=>record.id)).toEqual(['ecb-energy-rate-hike']);
});
