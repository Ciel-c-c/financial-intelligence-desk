import {expect,it} from 'vitest';
import {buildNewsAcceptance} from '../../scripts/news/acceptance.mjs';
it('does not count a model-version marker on an incomplete editorial as a deep interpretation',()=>{
 const hash='a'.repeat(64),news={attemptedAt:'2026-10-09T14:00:00Z',latest:[{publishedAt:'2026-10-09T14:00:00Z',article:{sha256:hash},editorial:{sourceBodyHash:hash,generator:{review:'edge-audit-v3'}}}],status:'fresh',sourceHealth:[]};
 expect(buildNewsAcceptance(news,undefined).current.deep).toBe(0);
});
it('does not turn a manual or empty workflow success into three scheduled content passes',()=>{
 const news={attemptedAt:'2026-10-09T14:00:00Z',latest:[],status:'fresh',sourceHealth:[]};
 const manual=buildNewsAcceptance(news,undefined,{scheduled:false});expect(manual.scheduledCycles).toEqual([]);expect(manual.status).toBe('pending');
 const scheduled=buildNewsAcceptance(news,manual,{scheduled:true});expect(scheduled.scheduledCycles[0].passed).toBe(false);expect(scheduled.status).toBe('pending');
});
it('does not count the same scheduled cycle twice',()=>{
 const news={attemptedAt:'2026-10-09T14:00:00Z',latest:[],status:'fresh',sourceHealth:[]};
 const first=buildNewsAcceptance(news,undefined,{scheduled:true});expect(buildNewsAcceptance(news,first,{scheduled:true}).scheduledCycles).toHaveLength(1);
});
