import {expect,it} from 'vitest';
import {mergeMarketSessions,selectCurrentMarketItems} from '../../scripts/site/market-sessions.mjs';
const now='2026-11-01T12:00:00Z';
const observation=(patch:any={})=>({id:'sp500',group:'us',name:'标普500',symbol:'SPX',value:100,currency:'NONE',unit:'点',session:'close',tradingDate:'2026-10-09',timeZone:'America/New_York',timestampPrecision:'date',provenance:'report',sourcePublishedAt:'2026-10-10T01:00:00Z',source:{id:'source-a',name:'Source A',url:'https://market.test/report'},evidence:'2026年10月9日标普500收盘100.00点。',valuePrecision:2,dataAsOf:'2026-10-09T00:00:00.000Z',fetchedAt:'2026-10-10T12:00:00Z',freshness:'fresh',marketState:'close',...patch});
const merge=(observations:any[],previous?:any)=>mergeMarketSessions({observations,previous,attemptedAt:now});
it('retains both sessions while a late opening never replaces a confirmed close',()=>{
 const first=merge([observation()]);const second=merge([observation({session:'open',value:95})],first.snapshot);
 expect(selectCurrentMarketItems(second.snapshot)[0].value).toBe(100);expect(second.snapshot.groups.us[0].open.sp500.value).toBe(95);
});
it('repeated observations do not count as new data or refresh their fetch time',()=>{
 const first=merge([observation()]);const second=merge([observation({fetchedAt:now})],first.snapshot);
 expect(first.newObservationCount).toBe(1);expect(second.newObservationCount).toBe(0);expect(selectCurrentMarketItems(second.snapshot)[0].fetchedAt).toBe('2026-10-10T12:00:00Z');
});
it('preserves previous valid values when new sources disagree beyond displayed precision',()=>{
 const first=merge([observation({value:99})]);const second=merge([observation({value:100,source:{id:'b',name:'B',url:'https://b.test/report'}}),observation({value:110,source:{id:'c',name:'C',url:'https://c.test/report'}})],first.snapshot);
 expect(second.conflicts).toHaveLength(1);expect(selectCurrentMarketItems(second.snapshot)[0].value).toBe(99);expect(second.newObservationCount).toBe(0);
});
it('allows only an explicitly newer same-source correction with changed evidence',()=>{
 const first=merge([observation()]);
 const unchanged=merge([observation({value:101})],first.snapshot);expect(selectCurrentMarketItems(unchanged.snapshot)[0].value).toBe(100);
 const corrected=merge([observation({value:101,sourcePublishedAt:'2026-10-10T02:00:00Z',evidence:'更正：2026年10月9日标普500收盘101.00点。'})],first.snapshot);
 expect(selectCurrentMarketItems(corrected.snapshot)[0].value).toBe(101);
});
it('never lets a late older compatible report undo a newer correction',()=>{
 const first=merge([observation({value:100.01,sourcePublishedAt:'2026-10-10T02:00:00Z',evidence:'更正：2026年10月9日收盘100.01点。'})]);
 const late=merge([observation({value:100,sourcePublishedAt:'2026-10-10T01:00:00Z'})],first.snapshot);
 expect(selectCurrentMarketItems(late.snapshot)[0].value).toBe(100.01);expect(late.newObservationCount).toBe(0);
});
it('collapses explicit same-source revisions before comparing independent sources',()=>{
 const result=merge([observation(),observation({value:101,sourcePublishedAt:'2026-10-10T02:00:00Z',evidence:'更正：2026年10月9日收盘101点。'})]);
 expect(result.conflicts).toEqual([]);expect(selectCurrentMarketItems(result.snapshot)[0].value).toBe(101);
});
it('retains the most recent twenty observed trading dates, not twenty fetch days',()=>{
 const rows=Array.from({length:25},(_,i)=>{const date='2026-10-'+String(i+1).padStart(2,'0');return observation({tradingDate:date,dataAsOf:date+'T00:00:00.000Z',sourcePublishedAt:'2026-10-26T01:00:00Z',fetchedAt:'2026-10-26T12:00:00Z'});});
 const result=merge(rows);expect(result.snapshot.groups.us).toHaveLength(20);expect(result.snapshot.groups.us.at(-1).tradingDate).toBe('2026-10-06');
});
it('keeps missing instruments and dates unchanged on partial or complete failure',()=>{
 const first=merge([observation(),observation({id:'dow',name:'道指',symbol:'DJI',value:200})]);
 const next=merge([observation({tradingDate:'2026-10-12',dataAsOf:'2026-10-12T00:00:00.000Z',sourcePublishedAt:'2026-10-13T01:00:00Z',fetchedAt:'2026-10-13T12:00:00Z'})],first.snapshot);
 const items=selectCurrentMarketItems(next.snapshot);expect(items).toHaveLength(2);expect(items.find(x=>x.id==='dow').tradingDate).toBe('2026-10-09');expect(selectCurrentMarketItems(merge([],next.snapshot).snapshot)).toEqual(items);
});
it('uses explicit source sessions for DST, early US closes and HK auction-final observations',()=>{
 const early=observation({timestampPrecision:'minute',dataAsOf:'2026-10-09T17:00:00Z'});
 const hk=observation({id:'hsi',group:'hongKong',timeZone:'Asia/Hong_Kong',timestampPrecision:'minute',dataAsOf:'2026-10-09T08:10:00Z'});
 expect(selectCurrentMarketItems(merge([early,hk]).snapshot).map(x=>x.session)).toEqual(['close','close']);
});
it('rejects corrupted prior session objects rather than publishing their values',()=>{
 const invalid={schemaVersion:1,groups:{us:[{tradingDate:'2026-10-09',close:{sp500:observation({value:NaN})}}]}};
 expect(selectCurrentMarketItems(merge([],invalid).snapshot)).toEqual([]);
});
