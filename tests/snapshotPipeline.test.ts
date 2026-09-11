import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { normalizeSourceItem } from '../scripts/global-situation-core.mjs';
import { parseEcbFx } from '../scripts/update-data-snapshots.mjs';
import { promoteValidatedSnapshot, validateGlobalSituation, validateMacroEvents, validateMarketSnapshot, validateUpdateStatus } from '../scripts/snapshot-schema.mjs';

const folders:string[]=[];
afterEach(async()=>Promise.all(folders.splice(0).map(path=>rm(path,{recursive:true,force:true}))));

describe('automated snapshot pipeline contracts',()=>{
  it('normalizes well-formed source data and rejects malformed records',()=>{
    expect(normalizeSourceItem({ headline:'  Rate   decision ', sourceUrl:'https://example.test/a', publishedAt:'bad' },{name:'Central bank',url:'https://example.test'},'2026-09-11T00:00:00Z')).toMatchObject({headline:'Rate decision',publishedAt:'2026-09-11T00:00:00Z'});
    expect(normalizeSourceItem({headline:'',sourceUrl:'javascript:bad'},{},'2026-09-11T00:00:00Z')).toBeUndefined();
  });

  it('parses fixture-like ECB market data with value, timestamp, source and freshness',()=>{
    const xml=`<Cube><Cube time='2026-09-11'><Cube currency='USD' rate='1.1750'/><Cube currency='JPY' rate='173.2'/></Cube></Cube>`;
    const result=parseEcbFx(xml,'2026-09-11T18:00:00Z');
    expect(result[0]).toMatchObject({id:'EURUSD',value:1.175,timestamp:'2026-09-11T00:00:00.000Z',freshness:'fresh',source:{name:'European Central Bank'}});
  });

  it('validates all four public snapshot schemas and evidence boundaries',()=>{
    const event={id:'e1',headline:'Policy decision',oneSentenceExplanation:'一句话',summary:'summary',sources:[{name:'Fed',url:'https://example.test',publishedAt:'2026-09-11T00:00:00Z'}],firstPublishedAt:'2026-09-11T00:00:00Z',latestSourceAt:'2026-09-11T00:00:00Z',fetchedAt:'2026-09-11T01:00:00Z',region:'global',countries:[],topic:'monetary-policy',eventType:'monetary-policy',marketRelevance:'medium',marketRelevanceScore:4,relevanceReasons:['inflation'],relatedAssets:[],relatedIndustries:[],relatedKnowledgePoints:['interest-rate'],factSummary:'官方已发布决定',marketView:['市场可能重估利率'],scenarios:['如果通胀持续，利率可能更久维持高位'],impactChain:[],watchConditions:[]};
    expect(validateGlobalSituation({schemaVersion:2,attemptedAt:'2026-09-11T01:00:00Z',lastSuccessfulAt:'2026-09-11T01:00:00Z',status:'fresh',sourceHealth:[],events:[event]})).toBe(true);
    expect(validateGlobalSituation({schemaVersion:2,lastSuccessfulAt:'bad',status:'fresh',events:[{...event,factSummary:undefined}]})).toBe(false);
    expect(validateMarketSnapshot({schemaVersion:1,generatedAt:'2026-09-11T01:00:00Z',instruments:[{id:'EURUSD',value:1.1,timestamp:'2026-09-11T00:00:00Z,',source:{url:'x'},freshness:'fresh'}]})).toBe(false);
    expect(validateMacroEvents({schemaVersion:1,generatedAt:'2026-09-11T01:00:00Z',events:[]})).toBe(true);
    expect(validateUpdateStatus({schemaVersion:1,attemptedAt:'2026-09-11T01:00:00Z',lastSuccessfulAt:'2026-09-11T01:00:00Z',status:'source_error',datasets:[]})).toBe(true);
  });

  it('does not overwrite the last successful snapshot when a candidate is malformed',async()=>{
    const folder=await mkdtemp(join(tmpdir(),'lens-snapshot-')); folders.push(folder); const path=join(folder,'snapshot.json');
    await writeFile(path,'{"lastSuccessfulAt":"kept"}\n');
    const result=await promoteValidatedSnapshot({path,candidate:{events:[]},validate:validateGlobalSituation});
    expect(result.promoted).toBe(false);
    expect(await readFile(path,'utf8')).toContain('kept');
  });
});
