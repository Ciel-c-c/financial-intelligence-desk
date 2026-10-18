import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it,vi} from 'vitest';
const {legacy}=vi.hoisted(()=>({legacy:vi.fn(()=>{throw Error('market must not execute');})}));
vi.mock('../../scripts/update-data-snapshots.mjs',()=>({updateSnapshots:legacy}));
vi.mock('../../scripts/news/update-news-feed.mjs',()=>({updateNewsFeed:async()=>undefined}));
import {runSiteUpdate} from '../../scripts/update-site-data.mjs';
it('publishes news and brief without executing or rewriting archived market production',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'news-only-mvp-'));
 try{
  const now='2026-10-18T12:17:00Z';
  await writeFile(join(dir,'news-feed.json'),JSON.stringify({schemaVersion:1,attemptedAt:now,lastSuccessfulAt:now,nextExpectedAt:'2026-10-19T00:17:00Z',status:'fresh',latest:[],continuing:[],retainedDetails:[],sourceHealth:[]}));
  const frozen=JSON.stringify({status:'delayed',groups:{aShare:[]}});
  await writeFile(join(dir,'market-overview.json'),frozen);
  const result=await runSiteUpdate({now,dataDir:dir});
  expect(legacy).not.toHaveBeenCalled();
  expect(await readFile(join(dir,'market-overview.json'),'utf8')).toBe(frozen);
  expect(result.datasets['news-feed'].promoted).toBe(true);
  const brief=JSON.parse(await readFile(join(dir,'daily-brief.json'),'utf8'));
  expect(Object.keys(brief.snapshotVersions)).toEqual(['news']);
 }finally{await rm(dir,{recursive:true,force:true});}
});
