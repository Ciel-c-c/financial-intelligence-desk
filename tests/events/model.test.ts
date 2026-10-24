import {describe,it,expect} from 'vitest';
import {worldEvents,relatedWorldEvents} from '../../src/data/worldEvents/registry';
import {validateWorldEvent,isClaimAvailable} from '../../src/data/worldEvents/validation';
import {findLesson} from '../../src/data/curriculum';
import type {WorldEvent} from '../../src/data/worldEvents/types';
function event():WorldEvent {return structuredClone(worldEvents[0]);}
describe('curated world event contracts',()=>{
 it('contains five dated historical samples, only one full interactive topic',()=>{
  expect(worldEvents).toHaveLength(5);
  expect(worldEvents.filter(e=>e.experience==='interactive').map(e=>e.id)).toEqual(['el-nino-2023']);
  expect(worldEvents.every(e=>e.historical&&e.period.end<e.curatedAt)).toBe(true);
  for(const e of worldEvents){expect(validateWorldEvent(e),e.id).toEqual([]);expect(e.lessonIds.every(id=>!!findLesson(id))).toBe(true);}
 });
 it('rejects dangling references and graph cycles',()=>{
  const e=event();expect(e).toBeDefined();
  e.edges.push({id:'bad-edge',from:'missing',to:'missing',explanationClaimId:'missing',conditions:[],invalidators:[],lag:null});
  expect(validateWorldEvent(e).join(' ')).toMatch(/reference/);
  const cycle=event();const edge=cycle.edges[0];cycle.edges.push({...edge,id:'cycle',from:edge.to,to:edge.from});
  expect(validateWorldEvent(cycle).join(' ')).toMatch(/cycle/);
 });
 it('withdrawn or changed evidence hides dependent facts and mechanisms, not just home cards',()=>{
  const e=event();expect(e).toBeDefined();const c=e.claims.find(c=>c.kind==='fact'&&c.evidenceRefs.some(r=>r.relation==='supports'))!;
  expect(isClaimAvailable(e,c)).toBe(true);e.evidence.find(x=>x.id===c.evidenceRefs[0].evidenceId)!.state='withdrawn';
  expect(isClaimAvailable(e,c)).toBe(false);
  e.evidence.find(x=>x.id===c.evidenceRefs[0].evidenceId)!.state='changed';expect(isClaimAvailable(e,c)).toBe(false);
 });
 it('associates only manually reviewed exact source URLs and body versions',()=>{
  const e=structuredClone(worldEvents.find(e=>e.newsLinks.some(x=>x.expectedSourceHash)))!;expect(e).toBeDefined();const link=e.newsLinks.find(x=>x.expectedSourceHash)!;expect(link).toBeDefined();
  const news={canonicalUrl:link.canonicalUrl,article:{sha256:link.expectedSourceHash} as never};
  expect(relatedWorldEvents(news,[e])).toHaveLength(1);
  expect(relatedWorldEvents({...news,canonicalUrl:'https://example.com/el-nino-same-keyword'},[e])).toEqual([]);
  expect(relatedWorldEvents({...news,article:{sha256:'different'} as never},[e])).toEqual([]);
  expect(relatedWorldEvents({...news,invalidationReason:'withdrawn'},[e])).toEqual([]);
 });
 it('supports one article linking multiple themes without merging different events',()=>{
  const e=structuredClone(worldEvents.find(e=>e.newsLinks.some(x=>x.expectedSourceHash)))!;expect(e).toBeDefined();const link=e.newsLinks.find(x=>x.expectedSourceHash)!;
  const other={...e,id:'second-topic'};
  expect(relatedWorldEvents({canonicalUrl:link.canonicalUrl,article:{sha256:link.expectedSourceHash} as never},[e,other])).toHaveLength(2);
 });
});

it('binds numerical disclosure prose to the actual earnings source',()=>{
 const e=structuredClone(worldEvents.find(e=>e.id==='nvidia-ai-2023'))!;
 const c=e.claims.find(c=>c.text.includes('0.82'))!;
 const source=e.evidence.find(s=>s.url.includes('first-quarter-fiscal-2024'))!;
 expect(isClaimAvailable(e,c)).toBe(true);source.state='withdrawn';
 expect(isClaimAvailable(e,c)).toBe(false);
});
it('requires every consecutive branch pair to have a reviewed edge',()=>{
 const e=event();e.edges=[];expect(validateWorldEvent(e).join(' ')).toMatch(/branch edge/);
});
