import {validateObservation,validTradingDate} from '../../src/data/marketObservationValidation.mjs';
export const MARKET_GROUPS=['aShare','hongKong','us','globalAssets'];
const SESSIONS=['open','close','reference'];
function compatible(a,b){
 if(a.symbol!==b.symbol||a.currency!==b.currency||a.unit!==b.unit)return false;
 const tolerance=(10**-a.valuePrecision+10**-b.valuePrecision)/2+1e-9;
 return Math.abs(a.value-b.value)<=tolerance&&(a.changePercent===undefined||b.changePercent===undefined||Math.abs(a.changePercent-b.changePercent)<=0.011);
}
const revisionTime=o=>Date.parse(o.sourcePublishedAt??(o.timestampPrecision!=='date'?o.dataAsOf:undefined));
const correction=(newer,older)=>newer.symbol===older.symbol&&newer.currency===older.currency&&newer.unit===older.unit
 &&revisionTime(newer)>revisionTime(older)&&(newer.evidence!==older.evidence||newer.timestampPrecision!=='date'&&newer.dataAsOf!==older.dataAsOf);
function cleanGroups(previous,now){
 return Object.fromEntries(MARKET_GROUPS.map(group=>[group,(Array.isArray(previous?.groups?.[group])?previous.groups[group]:[]).filter(row=>validTradingDate(row?.tradingDate)).map(row=>({tradingDate:row.tradingDate,...Object.fromEntries(SESSIONS.map(session=>[session,Object.fromEntries(Object.entries(row[session]??{}).filter(([id,o])=>o.id===id&&o.group===group&&o.session===session&&o.tradingDate===row.tradingDate&&validateObservation(o,now)))]))})).filter(row=>SESSIONS.some(s=>Object.keys(row[s]).length))]));
}
export function mergeMarketSessions({previous,observations=[],attemptedAt}){
 const groups=cleanGroups(previous,attemptedAt),conflicts=[],batches=new Map();let newObservationCount=0;
 for(const o of observations.filter(o=>validateObservation(o,attemptedAt))){const key=[o.group,o.tradingDate,o.session,o.id].join('|');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}
 for(const candidates of batches.values()){
  const first=candidates[0],rows=groups[first.group];let day=rows.find(r=>r.tradingDate===first.tradingDate);
  const prior=day?.[first.session]?.[first.id];
  const revisions=candidates.filter(o=>!candidates.some(newer=>newer.source.id===o.source.id&&correction(newer,o)));
  const accepted=revisions.filter(o=>!prior||o.source.id!==prior.source.id||o.value===prior.value&&o.changePercent===prior.changePercent||correction(o,prior));
  if(!accepted.length)continue;
  const all=prior&&accepted.some(o=>o.source.id!==prior.source.id)?[prior,...accepted]:accepted;
  if(all.some((a,i)=>all.slice(i+1).some(b=>!compatible(a,b)))){conflicts.push({group:first.group,tradingDate:first.tradingDate,session:first.session,id:first.id,sourceIds:[...new Set(all.map(o=>o.source.id))],reason:'conflicting-observations'});continue;}
  const selected=accepted.slice().sort((a,b)=>(revisionTime(b)||0)-(revisionTime(a)||0))[0];
  if(prior&&selected.value===prior.value&&selected.changePercent===prior.changePercent)continue;
  if(!day){day={tradingDate:first.tradingDate,open:{},close:{},reference:{}};rows.push(day);}
  let value=selected;
  if(value.changePercent===undefined&&value.session!=='reference'){
   const last=rows.filter(r=>r.tradingDate<value.tradingDate&&r.close[value.id]).sort((a,b)=>b.tradingDate.localeCompare(a.tradingDate))[0]?.close[value.id];
   if(last&&last.symbol===value.symbol&&last.unit===value.unit&&last.currency===value.currency){const change=value.value-last.value,pct=change/last.value*100;if(Math.abs(pct)<=100)value={...value,change:Number(change.toFixed(6)),changePercent:Number(pct.toFixed(6)),changeBasis:'previous-close'};}
  }
  day[value.session][value.id]=value;newObservationCount++;
 }
 for(const group of MARKET_GROUPS)groups[group]=groups[group].sort((a,b)=>b.tradingDate.localeCompare(a.tradingDate)).slice(0,20);
 return {snapshot:{schemaVersion:1,attemptedAt,groups},conflicts,newObservationCount};
}
export function selectCurrentMarketItems(snapshot){
 const groups=cleanGroups(snapshot,snapshot.attemptedAt??new Date().toISOString()),items=[];
 for(const group of MARKET_GROUPS){const seen=new Set();for(const row of groups[group].sort((a,b)=>b.tradingDate.localeCompare(a.tradingDate)))for(const session of ['close','reference','open'])for(const o of Object.values(row[session])){if(!seen.has(o.id)){seen.add(o.id);items.push(o);}}}
 return items;
}
export function validateMarketSessions(snapshot){
 return snapshot?.schemaVersion===1&&Number.isFinite(Date.parse(snapshot.attemptedAt))&&MARKET_GROUPS.every(g=>Array.isArray(snapshot.groups?.[g])&&snapshot.groups[g].length<=20&&snapshot.groups[g].every(row=>validTradingDate(row.tradingDate)&&SESSIONS.every(s=>row[s]&&typeof row[s]==='object'&&!Array.isArray(row[s])&&Object.entries(row[s]).every(([id,o])=>id===o.id&&o.group===g&&o.tradingDate===row.tradingDate&&o.session===s&&validateObservation(o,snapshot.attemptedAt)))));
}
