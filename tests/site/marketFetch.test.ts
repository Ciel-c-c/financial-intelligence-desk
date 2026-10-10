import {expect,it} from 'vitest';
import {fetchMarketSources} from '../../scripts/site/market-fetch.mjs';
import {marketSources} from '../../scripts/site/source-registry.mjs';
const source=marketSources.find(s=>s.id==='ecb-reference-rates'),now='2026-10-10T12:00:00Z';
const xml='<Cube time="2026-10-09"><Cube currency="USD" rate="1.10"/><Cube currency="JPY" rate="160.25"/></Cube>';
const response=(text=xml)=>({ok:true,status:200,url:source.baseUrl,headers:new Headers(),text:async()=>text});
it('retrieves date-only reference rates without inventing a publication time',async()=>{
 const rows=await fetchMarketSources({sources:[source],now,fetchImpl:async()=>response()});expect(rows[0].instruments).toHaveLength(2);expect(rows[0].instruments[0]).toMatchObject({session:'reference',tradingDate:'2026-10-09',timestampPrecision:'date',provenance:'reference'});expect(rows[0].instruments[0].sourcePublishedAt).toBeUndefined();
});
it('retries a transient 5xx once and does not retry a rate limit',async()=>{
 let calls=0;const good=await fetchMarketSources({sources:[source],now,fetchImpl:async()=>++calls===1?{ok:false,status:503}:response()});expect(calls).toBe(2);expect(good[0].status).toBe('ok');
 calls=0;const limited=await fetchMarketSources({sources:[source],now,fetchImpl:async()=>{calls++;return {ok:false,status:429};}});expect(calls).toBe(1);expect(limited[0].status).toBe('error');
});
it('withholds oversized, redirected, future-dated and empty source responses',async()=>{
 for(const r of [response('x'.repeat(2*1024*1024+1)),{...response(),url:'https://evil.test/data'},response(xml.replace('2026-10-09','2026-10-11')),response('')]){expect((await fetchMarketSources({sources:[source],now,fetchImpl:async()=>r}))[0].status).toBe('error');}
});
it('does not fetch disabled or expired sources and isolates a failed source',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return response();};const results=await fetchMarketSources({sources:[{...source,enabled:false},{...source,id:'expired',reviewExpiresAt:'2026-10-01T00:00:00Z'},source],now,fetchImpl});expect(calls).toBe(1);expect(results.some(r=>r.sourceId==='expired'&&r.status==='error')).toBe(true);expect(results.some(r=>r.sourceId===source.id&&r.status==='ok')).toBe(true);
});
