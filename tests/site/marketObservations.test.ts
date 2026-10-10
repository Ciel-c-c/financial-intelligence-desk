import {expect,it} from 'vitest';
import {normalizeObservation} from '../../scripts/site/market-observations.mjs';
import {validateObservation} from '../../src/data/marketObservationValidation.mjs';
const now='2026-10-10T12:00:00Z';
const source={id:'test-market',name:'Test source',baseUrl:'https://market.test/report/close',enabled:true,allowedHosts:['market.test'],allowedPathPatterns:['^/report/'],markets:['us'],reviewedAt:'2026-10-01T00:00:00Z',reviewExpiresAt:'2026-12-01T00:00:00Z',usageMode:'report-facts',termsUrl:'https://market.test/terms'};
const raw={id:'sp500',group:'us',name:'标普500',symbol:'SPX',value:100,changePercent:-1,currency:'NONE',unit:'点',session:'close',tradingDate:'2026-10-09',timeZone:'America/New_York',timestampPrecision:'date',provenance:'report',sourcePublishedAt:'2026-10-10T05:15:00+08:00',sourceUrl:source.baseUrl,evidence:'2026年10月9日标普500收于100点，下跌1%。',valuePrecision:2};
it('preserves the explicit US trading date instead of the next-day publication date',()=>{
 const o=normalizeObservation(raw,source,now);
 expect(o.tradingDate).toBe('2026-10-09');expect(o.timestampPrecision).toBe('date');expect(o.dataAsOf).toBe('2026-10-09T00:00:00.000Z');expect(o.sourcePublishedAt).toBe('2026-10-09T21:15:00.000Z');expect(validateObservation(o,now)).toBe(true);
});
it.each([{tradingDate:'2026-10-11'},{tradingDate:'2026-02-30'},{tradingDate:undefined},{evidence:undefined},{session:'trading'},{value:NaN},{value:-1},{timestampPrecision:'second',timestamp:undefined},{sourceUrl:'https://evil.test/report/close'},{sourceUrl:'https://market.test/not-a-report'}])('rejects malformed or unsupported observations %j',patch=>{
 expect(()=>normalizeObservation({...raw,...patch},source,now)).toThrow();
});
it('rejects a source not enabled or whose review has expired',()=>{
 expect(()=>normalizeObservation(raw,{...source,enabled:false},now)).toThrow();expect(()=>normalizeObservation(raw,{...source,reviewExpiresAt:'2026-10-09T00:00:00Z'},now)).toThrow();
});
it('requires timed observations to belong to the explicit local trading date',()=>{
 expect(()=>normalizeObservation({...raw,timestampPrecision:'second',timestamp:'2026-10-10T20:00:00Z'},source,now)).toThrow();
});
