import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
import {normalizeNewsItem} from '../../scripts/news/news-normalizer.mjs';
import {classifyNewsItem} from '../../scripts/news/news-classifier.mjs';
import {loadNewsFeed} from '../../src/data/newsFeed';
import {newsFeedSeed} from '../../src/data/newsFeedSeed';
import {LiveNewsCard} from '../../src/components/LiveNewsCard';
import {LiveNewsDetail} from '../../src/components/LiveNewsDetail';
import {NewsFeedStatus} from '../../src/components/NewsFeedStatus';
const now='2026-10-19T08:00:00Z';
const url='https://www.cnfin.com/yw-lb/detail/20261019/4485000_1.html';
const text='The company reported an update. Its original announcement provides the available details. '.repeat(5);
const item:any=classifyNewsItem(normalizeNewsItem({sourceId:'cnfin',sourceName:'新华财经',sourceTier:'verified',originalLanguage:'en',originalTitle:'Company provides its business update',sourceUrl:url,canonicalUrl:url,publishedAt:now,fetchedAt:now,article:{status:'complete',reader:'cnfin-body',text,characterCount:text.length,sha256:articleHash(text),sourceUrl:url,checkedAt:now}}));
it('never renders an unreviewed Chinese title when displaying verified source-only news',()=>{
 const record={...item,titleZh:'未经核验的译文',summaryZh:'不应展示的内容',chineseSummary:{status:'failed'}};
 render(<MemoryRouter><LiveNewsCard item={record}/><LiveNewsDetail item={record}/></MemoryRouter>);
 expect(screen.queryByText('未经核验的译文')).not.toBeInTheDocument();
 expect(screen.getAllByText(/中文整理失败/)).toHaveLength(2);
 expect(screen.getByRole('link',{name:'查看原始来源 ↗'})).toHaveAttribute('href',url);
});
it('verifies source-only body hashes when loading the feed',async()=>{
 vi.stubGlobal('crypto',webcrypto);
 try{
  const response=(record:any)=>async(path:any)=>({ok:true,json:async()=>String(path).includes('reviewed-news')?{items:[]}:{...newsFeedSeed,latest:[record]}}) as any;
  expect((await loadNewsFeed(response(item))).latest).toHaveLength(1);
  expect((await loadNewsFeed(response({...item,article:{...item.article,text:item.article.text+'changed'}}))).latest).toHaveLength(0);
 }finally{vi.unstubAllGlobals();}
});
it('uses an explicit not-attempted state for zero-denominator metrics',()=>{
 const stage={attempted:0,succeeded:0,failed:0,skipped:1,successRate:null};
 render(<NewsFeedStatus snapshot={{...newsFeedSeed,runMetrics:{fetch:{...stage,attempted:1,succeeded:1,successRate:1},translation:stage,analysis:stage}}}/>);
 expect(screen.getByText(/中文整理：未尝试/)).toBeInTheDocument();
 expect(screen.getByText(/深度分析：未尝试/)).toBeInTheDocument();
});
