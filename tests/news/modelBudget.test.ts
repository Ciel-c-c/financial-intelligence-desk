import {expect,it} from 'vitest';
import {requestModel} from '../../scripts/news/model-client.mjs';
const payload={stage:'summary',messages:[{role:'system',content:'Return JSON'},{role:'user',content:'source'}],responseFormat:{type:'json_object'},maxTokens:100};
const success={ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]})};
it('shares a twelve-request cap across stages without sending a thirteenth request',async()=>{
 let calls=0;const budget={requests:0,limit:12,stopped:false},options={apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async()=>{calls++;return success;}};
 for(let i=0;i<13;i++)await requestModel({...payload,stage:i%2?'audit':'summary'},options,budget);
 expect(calls).toBe(12);expect(budget.requests).toBe(12);expect(budget.stopped).toBe(true);
});
it('paces interleaved generation and review calls and uses only fixed Groq models',async()=>{
 const waits:number[]=[],models:string[]=[],budget={requests:0,limit:12,stopped:false};
 const options={apiKey:'test-secret',nowMs:()=>0,waitImpl:async ms=>{waits.push(ms);},fetchImpl:async(url,init)=>{expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');models.push(JSON.parse(init.body).model);return success;}};
 expect(await requestModel(payload,options,budget)).toEqual({ok:true});
 await requestModel({...payload,stage:'summary-audit'},options,budget);
 expect(waits).toEqual([60000]);expect(models).toEqual(['openai/gpt-oss-120b','openai/gpt-oss-20b']);
});
it('does not call a provider without a key',async()=>{
 let calls=0;await requestModel(payload,{fetchImpl:async()=>{calls++;return success;}},{requests:0,limit:12,stopped:false});expect(calls).toBe(0);
});
it('does not let a single JSON-generation failure prevent other summary tasks',async()=>{
 let calls=0;const budget={requests:0,limit:12,stopped:false},options={apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async()=>++calls===1?{ok:false,status:400,json:async()=>({error:{code:'json_validate_failed'}})}:success};
 expect(await requestModel(payload,options,budget)).toBeUndefined();expect(budget.stopped).toBe(false);
 expect(await requestModel(payload,options,budget)).toEqual({ok:true});expect(calls).toBe(2);
});
it.each([401,402,403,408,429,500,503])('stops shared model work on HTTP %s without paid fallback',async status=>{
 let calls=0;const budget={requests:0,limit:12,stopped:false};const options={apiKey:'test-secret',fetchImpl:async()=>{calls++;return {ok:false,status};}};
 expect(await requestModel(payload,options,budget)).toBeUndefined();await requestModel(payload,options,budget);expect(calls).toBe(1);expect(budget.stopped).toBe(true);
});
it('stops safely when the response connection fails or generated JSON is malformed',async()=>{
 for(const result of [{ok:true,json:async()=>{throw new TypeError('connection closed');}},{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]})}]){
  const budget={requests:0,limit:12,stopped:false};expect(await requestModel(payload,{apiKey:'test-secret',fetchImpl:async()=>result},budget)).toBeUndefined();expect(budget.stopped).toBe(true);
 }
});
