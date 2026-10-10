export const MARKET_TIME_ZONES={aShare:'Asia/Shanghai',hongKong:'Asia/Hong_Kong',us:'America/New_York',globalAssets:'UTC'};
export function dateInZone(value,timeZone){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
}
export function validTradingDate(value){
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
const iso=v=>typeof v==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
export function validateObservation(o,now=new Date().toISOString()){
 try{
  const url=new URL(o.source.url),time=Date.parse(now);
  if(!Number.isFinite(time)||!/^\w[\w-]{0,63}$/.test(o.id)||['__proto__','constructor','prototype'].includes(o.id)||!o.name||!o.symbol||!o.source.id||!o.source.name||url.protocol!=='https:'||url.username||url.password||url.port)return false;
  if(!MARKET_TIME_ZONES[o.group]||o.timeZone!==MARKET_TIME_ZONES[o.group]||!validTradingDate(o.tradingDate)||o.tradingDate>dateInZone(now,o.timeZone))return false;
  if(!['open','close','reference'].includes(o.session)||!['date','minute','second'].includes(o.timestampPrecision)||!['report','quote','reference'].includes(o.provenance))return false;
  if(o.session==='reference'&&o.provenance!=='reference'||o.provenance==='reference'&&o.session!=='reference')return false;
  if(!Number.isFinite(o.value)||o.value<=0||!Number.isInteger(o.valuePrecision)||o.valuePrecision<0||o.valuePrecision>8)return false;
  if(!['CNY','HKD','USD','EUR','JPY','GBP','NONE'].includes(o.currency)||typeof o.unit!=='string')return false;
  if(!iso(o.dataAsOf)||!iso(o.fetchedAt)||(o.provenance==='report'&&!iso(o.sourcePublishedAt))||(o.sourcePublishedAt!==undefined&&!iso(o.sourcePublishedAt))||[o.dataAsOf,o.fetchedAt,o.sourcePublishedAt].filter(Boolean).some(v=>Date.parse(v)>time))return false;
  if(Date.parse(o.sourcePublishedAt)>Date.parse(o.fetchedAt)||Date.parse(o.dataAsOf)>Date.parse(o.fetchedAt)||o.sourcePublishedAt&&o.tradingDate>dateInZone(o.sourcePublishedAt,o.timeZone))return false;
  if(o.timestampPrecision==='date' ? o.dataAsOf!==o.tradingDate+'T00:00:00.000Z' : dateInZone(o.dataAsOf,o.timeZone)!==o.tradingDate)return false;
  if(o.provenance==='report'&&(typeof o.evidence!=='string'||o.evidence.trim().length<6||o.evidence.length>600))return false;
  if(o.change!==undefined&&!Number.isFinite(o.change)||o.changePercent!==undefined&&(!Number.isFinite(o.changePercent)||Math.abs(o.changePercent)>100))return false;
  if(o.change!==undefined&&o.changePercent!==undefined&&Math.sign(o.change)!==Math.sign(o.changePercent))return false;
  return ['fresh','delayed'].includes(o.freshness)&&['delayed','close','previous_close'].includes(o.marketState);
 }catch{return false;}
}
