import {expect,it} from 'vitest';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
import {articleHash} from '../../scripts/news/full-article.mjs';
const now='2026-09-17T10:00:00Z';
const businessSoWhat={analogy:{image:'像商店接到订单。',explanation:'接到订单不等于赚到钱，还要完成交付并控制成本。'},why:{cause:'企业公布业务进展。',mechanisms:['订单落实后可能形成收入。','收入减去成本才是利润。'],result:'利润变化仍需要观察。'},focus:['订单落实与成本控制。'],marketBet:['订单能否落实。','交付能否完成。','成本能否控制。'],expectationGap:'报道没有提供市场一致预期，不能判断是否超预期。',counterView:'如果订单未落实或成本上升，业务进展可能不转化为盈利。',personalImpact:[{label:'企业经营',impact:'相关供应商的订单可能变化。',why:'业务落实可能传到采购需求。',condition:'若订单未落实或未增加采购，影响可能不成立。'}]};
const text='企业公布业务进展，并提醒盈利效果仍取决于订单落实与成本控制。'.repeat(20);
const raw={sourceId:'cnfin',sourceName:'新华财经',sourceTier:'verified',originalTitle:'企业公布新的业务进展',originalLanguage:'zh',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20260917/4472000_1.html',sourceUrl:'https://www.cnfin.com/yw-lb/detail/20260917/4472000_1.html',publishedAt:now,fetchedAt:now,article:{status:'complete',reader:'cnfin-body',text,characterCount:text.length,sha256:articleHash(text),sourceUrl:'https://www.cnfin.com/yw-lb/detail/20260917/4472000_1.html',checkedAt:now}};
function response(){return {language:'zh',title:'企业公布业务进展，盈利仍需观察',summary:'企业公布业务进展，订单落实与成本控制决定盈利效果。',excerpt:'报道未提供市场一致预期，不能判断是否超预期。',facts:[{text:'企业公布业务进展。',evidence:'企业公布业务进展'}],consensus:['常见机制：订单变化通过收入与成本传到盈利。'],inference:['条件性推演：订单落实可能增加收入。'],risks:['订单不能落实时，收入改善可能不成立。'],causalChain:[{title:'业务进展',explanation:'企业公布进展。',condition:'订单落实。'},{title:'收入可能变化',explanation:'订单转为收入。',condition:'交付完成。'},{title:'利润可能变化',explanation:'收入需要减去成本。',condition:'成本不抵消增长。'}],watchItems:['观察订单与利润。'],soWhat:structuredClone(businessSoWhat),political:null};}
async function run(output=response(),status=200,approved=true,provider='cerebras'){
 const fetchImpl=async(url,init)=>{
  expect(url).toBe(provider==='groq'?'https://api.groq.com/openai/v1/chat/completions':'https://api.cerebras.ai/v1/chat/completions');
  const sent=JSON.parse(init.body);
  if(provider==='groq') {expect(sent.model).toBe('openai/gpt-oss-120b');expect(sent.reasoning_effort).toBe('low');}
  expect(sent.messages[1].content).toContain(text);
  expect(sent.messages[1].content).not.toContain('test-secret');
  const content=JSON.stringify(sent.messages[0].content.includes('AUDIT_ONLY')?{approved}:output);
  return {ok:status===200,status,json:async()=>({choices:[{finish_reason:'stop',message:{content}}]})};
 };
 return buildNewsSnapshot({now,sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[raw]}],enrichmentOptions:{apiKey:'test-secret',fetchImpl,provider}});
}
it('publishes body-bound analysis using Groq rather than sending its key to Cerebras',async()=>{
 const result=await run(response(),200,true,'groq');
 expect(result.latest[0].editorial?.generator.provider).toBe('groq');
 expect(result.sourceHealth.find(s=>s.id==='groq-editorial')?.itemCount).toBe(1);
});
it('generates a complete body-bound editorial for news outside the three predefined rules',async()=>{
 const result=await run();
 expect(result.latest[0].editorial?.item.title).toBe('企业公布业务进展，盈利仍需观察');
 expect(result.latest[0].article.text).toBeUndefined();
 expect(result.latest[0].editorial?.sourceBodyHash).toBe(articleHash(text));
});
it('does not publish analysis whose factual evidence is absent from the body',async()=>{
 const output=response();output.facts[0].evidence='公司宣布降息四次';
 expect((await run(output)).latest[0].editorial).toBeUndefined();
});
it('does not turn a quota error into fabricated analysis',async()=>{
 expect((await run(response(),429)).latest[0].editorial).toBeUndefined();
});
it('withholds a structurally valid analysis when the separate audit rejects it',async()=>{
 expect((await run(response(),200,false)).latest[0].editorial).toBeUndefined();
});
it('does not mistake a previous headline-only record for a cached editorial',async()=>{
 const headline={...raw,article:undefined};
 const previous={latest:[headline],continuing:[],retainedDetails:[]};
 const result=await buildNewsSnapshot({now,previous,sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[headline]}]});
 expect(result.latest[0].editorial).toBeUndefined();
});
