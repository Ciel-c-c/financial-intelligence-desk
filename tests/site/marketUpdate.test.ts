import {expect,it} from 'vitest';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {updateMarketData} from '../../scripts/update-market-data.mjs';
import {marketSources} from '../../scripts/site/source-registry.mjs';
const source=marketSources.find(s=>s.id==='ecb-reference-rates');
it('retains dated observations and successful time on repeated data or source failures, without touching news',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'market-update-test-'));try{
  await writeFile(join(dir,'news-feed.json'),'{"sentinel":"unchanged"}');
  const other={id:'news-feed',status:'fresh',freshness:'delayed',lastSuccessfulAt:'2026-10-10T11:00:00Z',dataAsOf:'2026-10-10T10:00:00Z',nextExpectedAt:'2026-10-10T12:00:00Z'};
  await writeFile(join(dir,'site-snapshot.json'),JSON.stringify({schemaVersion:1,attemptedAt:'2026-10-10T11:00:00Z',lastSuccessfulAt:other.lastSuccessfulAt,status:'fresh',datasets:[other]}));
  const fetchImpl=async()=>({ok:true,status:200,url:source.baseUrl,headers:new Headers(),text:async()=>'<Cube time="2026-10-09"><Cube currency="USD" rate="1.10"/></Cube>'});
  const first=await updateMarketData({now:'2026-10-10T12:00:00Z',dataDir:dir,sources:[source],fetchImpl});
  const repeat=await updateMarketData({now:'2026-10-10T13:00:00Z',dataDir:dir,sources:[source],fetchImpl});
  const failed=await updateMarketData({now:'2026-10-10T14:00:00Z',dataDir:dir,sources:[source],fetchImpl:async()=>{throw Error('network');}});
  expect(first.market.groups.globalAssets[0].value).toBe(1.1);expect(repeat.market.lastSuccessfulAt).toBe(first.market.lastSuccessfulAt);expect(failed.market.lastSuccessfulAt).toBe(first.market.lastSuccessfulAt);expect(failed.market.dataAsOf).toBe('2026-10-09T00:00:00.000Z');expect(await readFile(join(dir,'news-feed.json'),'utf8')).toBe('{"sentinel":"unchanged"}');
  const site=JSON.parse(await readFile(join(dir,'site-snapshot.json'),'utf8'));expect(site.datasets.find(d=>d.id==='news-feed')).toEqual(other);expect(site.datasets.find(d=>d.id==='market-overview').dataAsOf).toBe('2026-10-09T00:00:00.000Z');
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('reports partial fetch coverage instead of counting retained instruments as fetched',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'market-coverage-test-'));try{
  const response=(xml:string)=>({ok:true,status:200,url:source.baseUrl,headers:new Headers(),text:async()=>xml});
  await updateMarketData({now:'2026-10-10T12:00:00Z',dataDir:dir,sources:[source],fetchImpl:async()=>response('<Cube time="2026-10-09"><Cube currency="USD" rate="1.10"/><Cube currency="JPY" rate="160.25"/></Cube>')});
  const next=await updateMarketData({now:'2026-10-10T13:00:00Z',dataDir:dir,sources:[source],fetchImpl:async()=>response('<Cube time="2026-10-09"><Cube currency="USD" rate="1.10"/></Cube>')});
  expect(next.market.groups.globalAssets).toHaveLength(2);expect(next.market.sourceHealth[0].itemCount).toBe(1);expect(next.market.groupHealth.globalAssets.status).toBe('partial');expect(next.market.groups.globalAssets.find(o=>o.id==='EURJPY').freshness).toBe('delayed');
 }finally{await rm(dir,{recursive:true,force:true});}
});
