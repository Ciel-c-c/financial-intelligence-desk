import {expect,it} from 'vitest';
import {orderDiverseNews} from '../../src/data/newsDiversity.mjs';
import {clusterNewsItems} from '../../scripts/news/news-clusterer.mjs';
import {parseNewsFeed} from '../../scripts/news/feed-parser.mjs';
const now='2026-10-21T08:00:00Z';
const item=(id:string,sourceName:string,title='Quarterly earnings report')=>({id,sourceName,sourceTier:'verified',canonicalUrl:`https://news.test/${id}`,originalTitle:title,publishedAt:'2026-10-21T07:00:00Z',importanceScore:55,clusterId:id,relatedSources:[],verificationStatus:'verified'});
it('limits one publisher family to two highlights when alternatives exist, without losing news',()=>{
 const rows=[...Array.from({length:10},(_,i)=>item(`b${i}`,i%2?'BBC News · 世界':'BBC News · 财经')), ...['CNBC','新华财经','SEC'].flatMap((n,i)=>[item(`${i}a`,n),item(`${i}b`,n)])];
 const ordered=orderDiverseNews(rows,now);
 expect(ordered).toHaveLength(rows.length);
 expect(new Set(ordered.map(r=>r.id)).size).toBe(rows.length);
 expect(ordered.slice(0,8).filter(r=>r.sourceName.startsWith('BBC'))).toHaveLength(2);
 expect(orderDiverseNews([...rows].reverse(),now).map(r=>r.id)).toEqual(ordered.map(r=>r.id));
});
it('gives explicit economic news priority over incidental world news',()=>{
 const rows=[item('general','BBC','Luxury yacht photos revealed'),item('policy','SEC','Trade tariffs and inflation outlook')];
 expect(orderDiverseNews(rows,now)[0].id).toBe('policy');
});
it('merges conservative same-event titles and keeps all original source links',()=>{
 const a=item('a','CNBC','Tesla quarterly profit beats estimates as revenue rises');
 const b={...item('b','Reuters','Tesla quarterly profit beats estimates, revenue rises'),sourceTier:'official'};
 const c=item('c','FT','Tesla quarterly profit misses estimates as revenue falls');
 const rows=clusterNewsItems([a,b,c]);
 expect(rows).toHaveLength(2);
 expect(rows.find(r=>r.id==='b')?.relatedSources).toContainEqual({name:'CNBC',url:a.canonicalUrl,publishedAt:a.publishedAt});
});
it('does not merge distinct releases just because their first sixteen characters match',()=>{
 const a=item('a','Fed','Federal Reserve Board raises capital requirements');
 const b=item('b','Fed','Federal Reserve Board approves a bank merger');
 a.clusterId=b.clusterId='legacy-prefix';
 expect(clusterNewsItems([a,b])).toHaveLength(2);
});
it('never combines a correction or a different numeric outcome into the original event',()=>{
 const a=item('a','A','Company profit rises 12 percent in third quarter');
 const b=item('b','B','Company profit rises 15 percent in third quarter');
 expect(clusterNewsItems([a,b])).toHaveLength(2);
});
it('interprets timezone-less NBS dates in China time on every runner',()=>{
 const xml='<rss><item><title>GDP核算</title><link>https://www.stats.gov.cn/sj/zxfb/202610/t20261020_1965658.html</link><pubDate>2026-10-20 09:30:00</pubDate></item></rss>';
 const source={id:'nbs-cn',name:'NBS',tier:'official',publisherDomains:['www.stats.gov.cn'],feedUrl:'https://www.stats.gov.cn/sj/zxfb/rss.xml',defaultLanguage:'zh',dateOffset:'+08:00'};
 expect(parseNewsFeed(xml,source,now)[0].publishedAt).toBe('2026-10-20T01:30:00.000Z');
});

it('restricts Eurostat product query identifiers and excludes signed ECB commentary',async()=>{
 const {newsSources}=await import('../../scripts/news/source-registry.mjs');
 const {buildSourcePolicies,isSourceAllowed}=await import('../../scripts/news/source-policy.mjs');
 const policies=buildSourcePolicies(newsSources,now);
 const row={sourceId:'eurostat',sourceTier:'official',canonicalUrl:'https://ec.europa.eu/eurostat/product?code=4-20102026-ap'};
 expect(isSourceAllowed(row,policies,now)).toBe(true);
 for(const query of ['', '?code=other','?code=4-20102026-ap&code=bad'])expect(isSourceAllowed({...row,canonicalUrl:'https://ec.europa.eu/eurostat/product'+query},policies,now)).toBe(false);
 expect(isSourceAllowed({sourceId:'ecb',sourceTier:'official',canonicalUrl:'https://www.ecb.europa.eu/press/key/date/2026/html/ecb.sp261021~401d6c4b70.en.html'},policies,now)).toBe(false);
});

it('never merges opposite assertions or negation hidden in otherwise similar long headlines',()=>{
 const a=item('a','A','Bank plans to increase capital requirements for major financial institutions during next quarter');
 const b=item('b','B','Bank plans no increase in capital requirements for major financial institutions during next quarter');
 expect(clusterNewsItems([a,b])).toHaveLength(2);
});
it('invalidates a corrected alternate source before clustering and redirects to the surviving event',async()=>{
 const {buildNewsSnapshot}=await import('../../scripts/news/update-news-feed.mjs');
 const sec={sourceId:'sec',sourceName:'SEC',sourceTier:'official',sourceUrl:'https://www.sec.gov/news/pressreleases.rss',canonicalUrl:'https://www.sec.gov/newsroom/press-releases/2026-109-economic-report',originalLanguage:'en',originalTitle:'Economic report on international investment and capital markets',originalSummary:'The regulator reported original investment values in the release. The publication describes the reported value as two and provides details of the latest announcement.',publishedAt:'2026-10-21T07:00:00Z',fetchedAt:now};
 const previous=await buildNewsSnapshot({now,sourceResults:[{id:'sec',name:'SEC',ok:true,items:[sec]}],enrichmentOptions:{processingStage:'source'}});
 const corrected={...sec,originalSummary:'The regulator corrected the investment values in the release. The publication describes the reported value as three and provides details of the revised announcement.'};
 const bea={...corrected,sourceId:'bea',sourceName:'BEA',sourceUrl:'https://apps.bea.gov/rss/rss.xml',canonicalUrl:'https://www.bea.gov/news/2026/economic-report',publishedAt:'2026-10-21T07:01:00Z'};
 const result=await buildNewsSnapshot({now,previous,sourceResults:[{id:'sec',name:'SEC',ok:true,items:[corrected]},{id:'bea',name:'BEA',ok:true,items:[bea]}],enrichmentOptions:{processingStage:'source'}});
 const old=[...result.latest,...result.continuing,...result.retainedDetails].find(n=>n.id===previous.latest[0].id);
 expect(old?.invalidationReason).toBe('superseded-source-version');
 expect(old?.factualSummary).toBeUndefined();
 expect(old?.supersededBy).toBe(result.latest.find(n=>n.sourceId==='bea')?.id);
 expect(old?.supersededBy).not.toBe(old?.id);
});
