import { describe,expect,it,vi } from 'vitest';
import { loadNewsFeed } from '../../src/data/newsFeed';
import { filterLiveNews,findLiveNewsById } from '../../src/data/selectors';
import type { NewsFeedSnapshot } from '../../src/data/newsFeedTypes';
import {webcrypto} from 'node:crypto';
import {reviewedItem} from '../fixtures/reviewedFeed';
const item:any={id:'live-1',originalTitle:'Fed rate',titleZh:'美联储利率',originalSummary:'',summaryZh:'利率摘要',sourceName:'Federal Reserve',analysisLevels:['宏观'],eventTypes:['货币政策'],impactChannels:['利率'],regions:['美国','全球']};
const snapshot:any={schemaVersion:1,attemptedAt:'2026-09-14T10:00:00Z',lastSuccessfulAt:'2026-09-14T10:00:00Z',nextExpectedAt:'2026-09-14T11:00:00Z',status:'fresh',latest:[item],continuing:[],retainedDetails:[],sourceHealth:[]};
describe('frontend news repository',()=>{
 it('does not restore a cached interpretation after explicit source withdrawal',async()=>{
  vi.stubGlobal('crypto',webcrypto);
  const withdrawn={...reviewedItem,article:undefined,editorial:undefined,invalidationReason:'body-mismatch'};
  const fetcher:any=async(path:string)=>({ok:true,json:async()=>path==='./data/reviewed-news.json'?{items:[reviewedItem]}:{...snapshot,latest:[],retainedDetails:[withdrawn]}});
  const result=await loadNewsFeed(fetcher);
  expect(result.retainedDetails.find(item=>item.id===reviewedItem.id)?.editorial).toBeUndefined();
  vi.unstubAllGlobals();
 });
 it('places a newly reviewed current report in latest, not the background section',async()=>{
  vi.stubGlobal('crypto',webcrypto);
  const date='2026-09-14T09:00:00Z';const current={...reviewedItem,publishedAt:date,editorial:{...reviewedItem.editorial!,item:{...reviewedItem.editorial!.item,publishedAt:date}}};
  const fetcher:any=async(path:string)=>({ok:true,json:async()=>path==='./data/reviewed-news.json'?{items:[current]}:{...snapshot,latest:[]}});
  const result=await loadNewsFeed(fetcher);
  expect(result.latest.map(i=>i.id)).toContain(current.id);
  expect(result.retainedDetails.map(i=>i.id)).not.toContain(current.id);
  vi.unstubAllGlobals();
 });
 it('loads the public snapshot and falls back on malformed data',async()=>{const ok=vi.fn().mockResolvedValue({ok:true,json:async()=>snapshot});expect((await loadNewsFeed(ok)).latest).toHaveLength(1);const bad=vi.fn().mockResolvedValue({ok:true,json:async()=>({bad:true})});expect((await loadNewsFeed(bad)).status).toBe('source_error');});
 it('finds retained stories and filters across multiple axes',()=>{const retained={...item,id:'old'};const value:NewsFeedSnapshot={...snapshot,latest:[item],retainedDetails:[retained]};expect(findLiveNewsById(value,'old')?.id).toBe('old');expect(filterLiveNews(value.latest,{query:'利率',region:'美国',level:'宏观',eventType:'货币政策'})).toHaveLength(1);expect(filterLiveNews(value.latest,{query:'',region:'中国',level:'全部',eventType:'全部'})).toHaveLength(0);});
});
