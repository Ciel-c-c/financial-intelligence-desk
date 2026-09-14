import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { buildNewsSnapshot, updateNewsFeed } from '../../scripts/news/update-news-feed.mjs';

const folders:string[]=[]; afterEach(async()=>Promise.all(folders.splice(0).map(path=>rm(path,{recursive:true,force:true}))));
const raw={sourceId:'nbs-cn',sourceName:'国家统计局',sourceTier:'official',sourceUrl:'https://www.stats.gov.cn/sj/zxfb/rss.xml',canonicalUrl:'https://www.stats.gov.cn/a',originalLanguage:'zh',originalTitle:'居民消费价格同比上涨',originalSummary:'CPI 上涨，市场关注通胀和利率。',publishedAt:'2026-09-14T10:00:00Z',fetchedAt:'2026-09-14T10:17:00Z'};

describe('news snapshot pipeline',()=>{
  it('builds a valid hourly snapshot with source health',async()=>{
    const value=await buildNewsSnapshot({now:'2026-09-14T10:17:00Z',sourceResults:[{id:'nbs-cn',name:'国家统计局',ok:true,items:[raw]}],previous:undefined,enrichmentOptions:{cache:{}}});
    expect(value).toMatchObject({status:'fresh',nextExpectedAt:'2026-09-14T11:17:00.000Z'});
    expect(value.latest).toHaveLength(1); expect(value.sourceHealth[0]).toMatchObject({status:'ok',itemCount:1});
  });
  it('does not overwrite a successful snapshot when every source fails',async()=>{
    const folder=await mkdtemp(join(tmpdir(),'news-feed-'));folders.push(folder);const outputPath=join(folder,'news.json');
    const previous=await buildNewsSnapshot({now:'2026-09-14T10:17:00Z',sourceResults:[{id:'nbs-cn',name:'国家统计局',ok:true,items:[raw]}],enrichmentOptions:{cache:{}}});
    await updateNewsFeed({now:'2026-09-14T11:17:00Z',sourceResults:[{id:'nbs-cn',name:'国家统计局',ok:false,items:[],error:'down'}],outputPath,previous,enrichmentOptions:{cache:{}}});
    const saved=JSON.parse(await readFile(outputPath,'utf8'));
    expect(saved.lastSuccessfulAt).toBe(previous.lastSuccessfulAt); expect(saved.latest).toEqual(previous.latest); expect(saved.status).toBe('source_error');
  });
  it('publishes news health into the shared update status',async()=>{
    const folder=await mkdtemp(join(tmpdir(),'news-status-'));folders.push(folder);const outputPath=join(folder,'news.json');const statusPath=join(folder,'status.json');
    await updateNewsFeed({now:'2026-09-14T10:17:00Z',sourceResults:[{id:'nbs-cn',name:'国家统计局',ok:true,items:[raw]}],outputPath,statusPath,enrichmentOptions:{cache:{}}});
    const status=JSON.parse(await readFile(statusPath,'utf8'));
    expect(status.datasets).toEqual([{id:'news-feed',status:'fresh',lastSuccessfulAt:'2026-09-14T10:17:00Z'}]);
    expect(status.sourceHealth[0]).toMatchObject({id:'news-nbs-cn',name:'国家统计局（新闻）'});
  });
});
