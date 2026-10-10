import {render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import {MarketOverview} from '../../src/components/MarketOverview';
import {isMarketOverviewSnapshot} from '../../src/data/snapshotRepository';
import type {MarketOverviewSnapshot} from '../../src/data/siteSnapshotTypes';
const item={id:'sp500',group:'us',name:'标普500',symbol:'SPX',value:7811.54,changePercent:0.59,currency:'NONE',unit:'点',session:'close',tradingDate:'2026-10-09',timeZone:'America/New_York',timestampPrecision:'date',provenance:'report',sourcePublishedAt:'2026-10-10T01:00:00Z',source:{id:'source',name:'Source',url:'https://market.test/report'},evidence:'标普500在2026年10月9日收于7811.54点。',valuePrecision:2,dataAsOf:'2026-10-09T00:00:00.000Z',fetchedAt:'2026-10-10T12:00:00Z',freshness:'delayed',marketState:'previous_close'};
const snapshot={schemaVersion:1,attemptedAt:'2026-10-10T12:00:00Z',status:'partial',groups:{aShare:[],hongKong:[],us:[item],globalAssets:[]},groupHealth:{us:{status:'delayed',sourceIds:[]}},sessionSummary:{us:{tradingDate:'2026-10-09',session:'close',facts:['标普500收于7,811.54点，上涨0.59%。'],explanations:[{newsId:'linked-news',text:'利率变化可能影响估值。',conditional:true,attribution:'机制参考，不代表已确认的当日涨跌原因',sourceUrl:'https://market.test/news'}],watchItems:['观察盈利预期。'],invalidationConditions:['盈利改善可能抵消估值压力。'],sources:[item.source]}}} as MarketOverviewSnapshot;
it('labels a reported close with its actual trading date and no invented clock time',()=>{
 render(<MarketOverview snapshot={snapshot} activeGroup="us" onGroupChange={()=>{}}/>);
 expect(screen.getAllByText(/报道快照/).length).toBeGreaterThan(0);expect(screen.getByText(/交易日期：2026-10-09/)).toBeInTheDocument();expect(screen.queryByText(/2026\/10\/9 08:00/)).not.toBeInTheDocument();expect(screen.getByText(/最近有效数据/)).toBeInTheDocument();
});
it('keeps closing facts and provides a clickable mechanism explanation',()=>{
 render(<MarketOverview snapshot={snapshot} activeGroup="us" onGroupChange={()=>{}}/>);
 expect(screen.getByText(snapshot.sessionSummary!.us!.facts[0])).toBeInTheDocument();expect(screen.getByRole('link',{name:'查看相关解读 →'})).toHaveAttribute('href','#/news/linked-news');expect(screen.getByText(/机制参考，不代表已确认的当日涨跌原因/)).toBeInTheDocument();
});
it('distinguishes reference dates from stock market close dates',()=>{
 const reference={...item,id:'EURUSD',group:'globalAssets',name:'欧元兑美元',symbol:'EURUSD',value:1.1,session:'reference',provenance:'reference',timeZone:'UTC',sourcePublishedAt:undefined,changePercent:undefined};
 render(<MarketOverview snapshot={{...snapshot,groups:{...snapshot.groups,globalAssets:[reference]},groupHealth:{...snapshot.groupHealth,globalAssets:{status:'delayed',sourceIds:[]}}} as MarketOverviewSnapshot} activeGroup="globalAssets" onGroupChange={()=>{}}/>);
 expect(screen.getAllByText(/参考数据/).length).toBeGreaterThan(0);expect(screen.getByText(/参考日期：2026-10-09/)).toBeInTheDocument();
});
it('rejects corrupt session metadata while retaining legacy-compatible snapshots',()=>{
 expect(isMarketOverviewSnapshot(snapshot)).toBe(true);expect(isMarketOverviewSnapshot({...snapshot,groups:{...snapshot.groups,us:[{...item,tradingDate:'2030-01-01'}]}})).toBe(false);
});
