import {setTimeout as wait} from 'node:timers/promises';
export const GENERATION_MODEL='openai/gpt-oss-120b';
export const REVIEW_MODEL='openai/gpt-oss-20b';
const queues=new WeakMap();
export function requestModel(payload,options,budget){
 const task=(queues.get(budget)??Promise.resolve()).then(()=>perform(payload,options,budget));
 queues.set(budget,task.catch(()=>undefined));return task;
}
async function perform({stage,messages,responseFormat,maxTokens},options,budget){
 if(!options.apiKey||budget.stopped)return undefined;
 budget.protocolFailure=false;
 const limit=Number.isInteger(budget.limit)&&budget.limit>0?Math.min(12,budget.limit):12;
 if((budget.requests??0)>=limit){budget.stopped=true;budget.reason='Request budget exhausted';return undefined;}
 const fail=reason=>{budget.failures=(budget.failures??0)+1;budget.stopped=true;budget.reason=reason;return undefined;};
 try{
  const clock=options.nowMs??Date.now;
  if(budget.lastRequestAt!==undefined)await(options.waitImpl??wait)(Math.max(0,60000-(clock()-budget.lastRequestAt)));
  budget.requests=(budget.requests??0)+1;budget.lastRequestAt=clock();
  const review=stage==='audit'||stage==='summary-audit';
  const response=await(options.fetchImpl??fetch)('https://api.groq.com/openai/v1/chat/completions',{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(45000),headers:{authorization:`Bearer ${options.apiKey}`,'content-type':'application/json'},
   body:JSON.stringify({model:review?REVIEW_MODEL:GENERATION_MODEL,messages,stream:false,reasoning_effort:'low',include_reasoning:false,temperature:0.1,max_completion_tokens:Math.min(3500,Math.max(100,maxTokens??1400)),response_format:responseFormat}),
  });
  if(!response.ok){
   if(response.status===400){
    try{const code=(await response.json()).error?.code;if(code==='json_validate_failed'){
     budget.failures=(budget.failures??0)+1;budget.protocolFailure=true;budget.reason='Provider JSON-generation failure';return undefined;
    }}catch{}
   }
   return fail(`HTTP ${response.status}`);
  }
  let data;
  try{data=await response.json();}catch{return fail('Provider response body failure');}
  const choice=data.choices?.[0];
  if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string')return fail('Provider protocol failure');
  try{const value=JSON.parse(choice.message.content);return value&&typeof value==='object'&&!Array.isArray(value)?value:fail('Provider protocol failure');}catch{return fail('Provider protocol failure');}
 }catch{return fail('Provider network failure');}
}
