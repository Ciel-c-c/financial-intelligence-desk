import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it,vi,beforeEach} from 'vitest';
import {webcrypto} from 'node:crypto';
beforeEach(()=>vi.stubGlobal('crypto',webcrypto));
import {LiveNewsDetail} from '../../src/components/LiveNewsDetail';
import {isPublishableSummary,verifyNewsEvidence} from '../../src/data/newsAdmission';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
import reviewed from '../fixtures/reviewed-news.json';
import type {LiveNewsItem} from '../../src/data/newsFeedTypes';
const summary='联合国报告介绍全球经济与就业面临的挑战，强调各国需要结合自身条件采取行动。报告提出改善就业机会和公共服务，但并未提供股票市场走势或市场一致预期。相关影响需要结合后续政策落实情况判断。';
const item=prepareNewsEvidence({...reviewed.items[0],editorial:undefined,article:undefined,invalidationReason:undefined,sourceId:'un-zh',sourceName:'UN News',sourceTier:'official',verificationStatus:'official',canonicalUrl:'https://news.un.org/zh/story/2026/10/1140000',originalLanguage:'zh',originalTitle:'联合国介绍全球经济与就业挑战',originalSummary:summary,titleZh:'联合国介绍全球经济与就业挑战',summaryZh:summary,translationStatus:'original-zh'}) as LiveNewsItem;
it('publishes a bound Chinese official summary without inventing an interpretation',async()=>{
 expect(isPublishableSummary(item)).toBe(true);
 expect(await verifyNewsEvidence(item)).toBe(true);
 render(<MemoryRouter><LiveNewsDetail item={item}/></MemoryRouter>);
 expect(screen.getByText('来源事实总结 · 尚未生成深度解读')).toBeInTheDocument();
 expect(screen.getByText(summary)).toBeInTheDocument();
 expect(screen.queryByText('所以呢？')).not.toBeInTheDocument();
});
it('withholds summaries with changed evidence or an unapproved host',async()=>{
 expect(isPublishableSummary({...item,canonicalUrl:'https://evil.test/story'})).toBe(false);
 expect(isPublishableSummary({...item,originalLanguage:'en'})).toBe(false);
 expect(await verifyNewsEvidence({...item,article:{...item.article!,sha256:'a'.repeat(64)}})).toBe(false);
});
it('accepts the official UN feed-view Chinese story route',()=>{
 const url='https://news.un.org/feed/view/zh/story/2026/10/1142960';
 expect(isPublishableSummary({...item,canonicalUrl:url,article:{...item.article!,sourceUrl:url}})).toBe(true);
});
