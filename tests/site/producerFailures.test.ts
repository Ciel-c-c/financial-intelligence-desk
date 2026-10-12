import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it,vi} from 'vitest';
import {runSiteUpdate} from '../../scripts/update-site-data.mjs';
vi.mock('../../scripts/update-data-snapshots.mjs',()=>({updateSnapshots:async()=>undefined}));
vi.mock('../../scripts/news/update-news-feed.mjs',()=>({updateNewsFeed:async()=>{throw new Error('invalid generated news snapshot');}}));
it('does not report a successful default site update when its news producer fails',async()=>{
 const dataDir=await mkdtemp(join(tmpdir(),'lens-producer-failure-'));
 try{await expect(runSiteUpdate({now:'2026-10-12T13:00:00Z',dataDir})).rejects.toThrow('Data producer failed');}
 finally{await rm(dataDir,{recursive:true,force:true});}
});
