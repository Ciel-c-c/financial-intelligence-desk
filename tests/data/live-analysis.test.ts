import { describe, expect, it } from 'vitest';
import { liveAnalysis } from '../../src/data/liveAnalysis';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';
const story=(title:string,channels:string[]=[])=>({id:'new-event',originalTitle:title,titleZh:title,originalSummary:title,facts:[title],expectations:[],inferences:[],impactChannels:channels,eventTypes:[],regions:['全球'],keyTerms:[],causalSignals:[],publishedAt:'2026-09-15T00:00:00Z',sourceName:'BBC',sourceUrl:'https://bbc.com/a'} as LiveNewsItem);
describe('live evidence-linked explanation',()=>{
 it('explains shipping costs without recycling an oil forecast',()=>{
  const result=liveAnalysis(story('Red Sea shipping disruption'))!;
  expect(result.item.facts).toEqual(['Red Sea shipping disruption']);
  expect(result.soWhat.next.join(' ')).toContain('运输');
  expect(result.soWhat.next.join(' ')).not.toContain('油价');
  expect(result.item.consensus.join(' ')).toContain('机制');
 });
 it('does not fabricate a causal story for unidentified events',()=>expect(liveAnalysis(story('Official statement released'))).toBeUndefined());
 it('connects inflation to housing only with a rate channel',()=>{
  expect(liveAnalysis(story('CPI inflation release',['通胀']))!.soWhat.personalImpact.some(x=>x.label==='住房')).toBe(false);
  expect(liveAnalysis(story('CPI inflation release',['通胀','利率']))!.soWhat.personalImpact.some(x=>x.label==='住房')).toBe(true);
 });
});
