import {expect,it} from 'vitest';
import {buildFactualSummary} from '../../scripts/news/factual-summary.mjs';
import * as summaries from '../../scripts/news/factual-summary.mjs';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
import {buildSourcePolicies} from '../../scripts/news/source-policy.mjs';
import {newsSources} from '../../scripts/news/source-registry.mjs';
const now='2026-10-09T14:00:00Z',policies=buildSourcePolicies(newsSources,now);
const raw={id:'en-summary',sourceId:'cnbc-markets',sourceTier:'verified',originalLanguage:'en',originalTitle:'Nvidia-backed data centre company scraps IPO',originalSummary:'The company cancelled its initial public offering because of recent market volatility and prevailing market conditions. No new revenue forecast was announced.',canonicalUrl:'https://www.cnbc.com/2026/10/09/ai-ipo.html',publishedAt:now,fetchedAt:now};
const record=prepareNewsEvidence(raw);
const generated={title:'英伟达支持的数据中心企业取消上市',summary:'这家数据中心企业取消首次公开募股，将决定归因于近期市场波动和整体市场环境。报道没有宣布新的收入预测，不能据此判断订单已经下降。',facts:[{text:'公司取消上市，称原因是市场波动和整体市场环境。',evidence:'E1'}]};
it('keeps English fallback eligible only in the opt-in translation queue',()=>{
 const input={...record,factualSummary:{language:'en',origin:'publisher-en'}};
 expect(summaries.needsFactualSummary?.(input,{preferChinese:true})).toBe(true);
 expect(summaries.needsFactualSummary?.(input,{})).toBe(false);
 expect(summaries.needsFactualSummary?.({...input,factualSummary:{language:'zh'}},{preferChinese:true})).toBe(false);
});
async function run(approved=true,output:any=generated,input:any=record,preferChinese=false){
 const budget={requests:0,limit:12,stopped:false};
 const fetchImpl=async(_url,init)=>{
  const request=JSON.parse(init.body),source=JSON.parse(request.messages[1].content);
  const audit=request.messages[0].content.startsWith('SUMMARY_AUDIT');
  const quote=Object.entries(source.evidenceFragments??{}).find(([,text])=>String(text).includes('cancelled'))?.[0];
  const value=audit?{approved,facts:[approved],title:approved,summary:approved,preservesMeaning:approved}:{...output,facts:output.facts.map(f=>({...f,evidence:quote}))};
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
 };
 return {value:await buildFactualSummary(input,{policies,budget,preferChinese,modelOptions:{apiKey:'test-secret',fetchImpl,waitImpl:async()=>{},nowMs:()=>0}}),budget};
}
it('can explicitly translate a permitted English publisher summary instead of returning it before generation',async()=>{
 const input=prepareNewsEvidence({...raw,sourceId:'bbc-business',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc'});
 const {value,budget}=await run(true,generated,input,true);
 expect(value).toMatchObject({origin:'model',language:'zh',title:generated.title});
 expect(budget.requests).toBe(2);
 expect((await run(false,generated,input,true)).value).toBeUndefined();
});
it('publishes English fallback only after the independent audit approves it',async()=>{
 const english={language:'en',title:raw.originalTitle,summary:raw.originalSummary,facts:[{text:'The company cancelled its initial public offering.',evidence:'E1'}]};
 const result=await run(true,english);expect(result.value?.language).toBe('en');expect(result.budget.requests).toBe(2);
 expect((await run(false,english)).value).toBeUndefined();
});
it('bounds repeated unavailable translations while preserving the permitted English fallback',async()=>{
 const input={...raw,sourceId:'bbc-business',sourceName:'BBC News',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc'};
 let previous,translations=0;
 const fetchImpl=async(_url,init)=>{
  const payload=JSON.parse(init.body),stage=payload.messages[0].content;
  let value:any={};
  if(stage.startsWith('SUMMARY_ONLY')){
   translations++;
   const source=JSON.parse(payload.messages[1].content);
   const evidence=Object.entries(source.evidenceFragments).find(([,quote])=>String(quote).includes('cancelled'))?.[0];
   value={language:'en',title:input.originalTitle,summary:input.originalSummary,facts:[{text:'The company cancelled its initial public offering.',evidence}]};
  }else if(stage.startsWith('SUMMARY_AUDIT'))value={approved:true,facts:[true],title:true,summary:true,preservesMeaning:true};
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
 };
 for(let index=0;index<4;index++)previous=await buildNewsSnapshot({now,previous,sourceResults:[{id:'bbc-business',name:'BBC News',ok:true,items:[input]}],enrichmentOptions:{preferChineseSummaries:true,apiKey:'test-secret',fetchImpl,waitImpl:async()=>{},nowMs:()=>0}});
 expect(translations).toBe(3);
 expect(previous.latest[0].factualSummary).toMatchObject({origin:'publisher-en',language:'en',summary:input.originalSummary});
 expect(previous.latest[0].queue.summaryAttempt).toBe(3);
});
it('generates Chinese summaries with accurate Chinese names, without requiring English literal names',async()=>{
 const {value,budget}=await run();expect(value?.title).toBe(generated.title);expect(value?.origin).toBe('model');expect(value?.evidenceScope).toBe('summary');expect(budget.requests).toBe(2);
});
it('withholds translations when semantic review rejects direction, attribution or prediction meaning',async()=>{
 expect((await run(false)).value).toBeUndefined();
});
it('rejects invented numerical facts before spending the audit request',async()=>{
 const {value,budget}=await run(true,{...generated,summary:generated.summary+'股价可能上涨70%。'});expect(value).toBeUndefined();expect(budget.requests).toBe(1);
});
it('does not use model requests for allowed original Chinese publisher summaries',async()=>{
 const input=prepareNewsEvidence({...raw,sourceId:'un-zh',sourceTier:'official',originalLanguage:'zh',originalTitle:'联合国发布经济发展报告',originalSummary:'联合国发布经济发展报告，介绍冲突与经济变化对家庭生活及就业的影响。报告强调公共服务和政策落实的重要性，后续改善仍需要结合当地条件判断，不能从单条新闻推断所有资产的涨跌。',canonicalUrl:'https://news.un.org/feed/view/zh/story/2026/10/1142960'});
 const budget={requests:0,limit:12,stopped:false};expect((await buildFactualSummary(input,{policies,budget,modelOptions:{}}))?.origin).toBe('publisher-zh');expect(budget.requests).toBe(0);
});
it('publishes permitted English RSS summaries without a translation dependency or model request',async()=>{
 const input=prepareNewsEvidence({...raw,sourceId:'bbc-business',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc'});
 const budget={requests:0,limit:12,stopped:false};
 const value=await buildFactualSummary(input,{policies,budget,modelOptions:{}});
 expect(value).toMatchObject({origin:'publisher-en',language:'en',title:input.originalTitle,summary:input.originalSummary});expect(budget.requests).toBe(0);
});
it('does not publish unapproved English publisher text or headline-only feeds as a native summary',async()=>{
 const budget={requests:0,limit:12,stopped:false};
 expect(await buildFactualSummary(record,{policies,budget,modelOptions:{}})).toBeUndefined();
 const short=prepareNewsEvidence({...raw,sourceId:'bbc-business',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc',originalSummary:'Only a headline.'});
 expect(await buildFactualSummary(short,{policies,budget,modelOptions:{}})).toBeUndefined();
});
it('does not start generation when only one request is left or the source is headline-only',async()=>{
 const budget={requests:11,limit:12,stopped:false};expect(await buildFactualSummary(record,{policies,budget,modelOptions:{apiKey:'test-secret'}})).toBeUndefined();expect(budget.requests).toBe(11);
 expect(await buildFactualSummary({...raw,originalSummary:undefined},{policies,budget:{requests:0,limit:12,stopped:false},modelOptions:{apiKey:'test-secret'}})).toBeUndefined();
});
