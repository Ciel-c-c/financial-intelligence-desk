import {normalizeObservation} from './market-observations.mjs';
import {MARKET_TIME_ZONES,validTradingDate} from '../../src/data/marketObservationValidation.mjs';
export const INSTRUMENT_CATALOG=[
 {id:'sse-composite',group:'aShare',name:'上证指数',symbol:'000001',aliases:['上证指数','上证综指','沪指']},
 {id:'szse-component',group:'aShare',name:'深证成指',symbol:'399001',aliases:['深证成指']},
 {id:'chinext',group:'aShare',name:'创业板指',symbol:'399006',aliases:['创业板指数','创业板指']},
 {id:'hang-seng',group:'hongKong',name:'恒生指数',symbol:'HSI',aliases:['恒生指数','Hang Seng Index']},
 {id:'hang-seng-tech',group:'hongKong',name:'恒生科技指数',symbol:'HSTECH',aliases:['恒生科技指数','Hang Seng Tech Index']},
 {id:'sp500',group:'us',name:'标普500',symbol:'SPX',aliases:['标普500指数','标普500','S&P 500']},
 {id:'dow-jones',group:'us',name:'道琼斯指数',symbol:'DJI',aliases:['道琼斯工业平均指数','道琼斯指数','道指','Dow Jones Industrial Average','Dow Jones']},
 {id:'nasdaq-composite',group:'us',name:'纳斯达克综合指数',symbol:'IXIC',aliases:['纳斯达克综合指数','纳斯达克指数','纳指','Nasdaq Composite']},
];
const number='(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function reportedDate(text){
 const zh=text.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/),iso=text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
 if(zh||iso){const m=zh??iso;return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');}
 const en=text.match(new RegExp('\\b('+months.join('|')+')\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b','i'));
 return en?en[3]+'-'+String(months.findIndex(m=>m.toLowerCase()===en[1].toLowerCase())+1).padStart(2,'0')+'-'+en[2].padStart(2,'0'):undefined;
}
function datesIn(text){
 const pattern=new RegExp('20\\d{2}年\\s*\\d{1,2}月\\s*\\d{1,2}日|\\b20\\d{2}-\\d{2}-\\d{2}\\b|\\b(?:'+months.join('|')+')\\s+\\d{1,2},?\\s+20\\d{2}\\b','gi');
 return [...new Set([...text.matchAll(pattern)].filter(m=>!/发布时间|更新时间|published\s*(?:at|on)?\s*$|updated\s*(?:at|on)?\s*$/i.test(text.slice(Math.max(0,m.index-20),m.index))).map(m=>reportedDate(m[0])).filter(validTradingDate))];
}
export function parseMarketReport(report,{now,policy}){
 try{
  const text=report.text;
  if(report.sourceId!==policy.id||typeof text!=='string'||text.trim().length<60||text.length>100000||/<(?:html|nav|script)\b/i.test(text))return [];
  // Ambiguous retrospective/premarket/forecast reports are withheld rather
  // than converting their figures into session observations.
  if(/今年以来|年初至今|预计收盘|盘前|premarket|pre-market|year.to.date|expected to close/i.test(text))return [];
  const documentDates=datesIn(text);if(!documentDates.length)return [];
  const matches=[];
  for(const item of INSTRUMENT_CATALOG)for(const alias of item.aliases){const index=text.toLowerCase().indexOf(alias.toLowerCase());if(index>=0)matches.push({item,index,alias});}
  matches.sort((a,b)=>a.index-b.index||b.alias.length-a.alias.length);
  const unique=matches.filter((m,index)=>index===0||m.index!==matches[index-1].index);
  const observations=[];
  for(let i=0;i<unique.length;i++){
   const {item,index}=unique[i],segment=text.slice(index,Math.min(unique[i+1]?.index??text.length,index+250));
   const precedingBoundaries=[...text.slice(0,index).matchAll(/[。\n]|(?<!\d)\.(?!\d)/g)];
   const contextStart=precedingBoundaries.at(-1)?.index+1||0;
   const endBoundary=segment.match(/[。\n]|(?<!\d)\.(?!\d)/)?.index??segment.length;
   const context=text.slice(contextStart,index+endBoundary),localDates=datesIn(context);
   const tradingDate=localDates.length===1?localDates[0]:localDates.length===0&&documentDates.length===1?documentDates[0]:undefined;
   if(!validTradingDate(tradingDate))continue;
   const partialDay=context.match(/(?:^|[^\d])(\d{1,2})日/);if(partialDay&&Number(partialDay[1])!==Number(tradingDate.slice(-2)))continue;
   if(/期货|ETF|futures|收市竞价|暂报|可能|预计|would|could|might/i.test(segment))continue;
   const close=segment.match(new RegExp('(?:收于|收报|收盘(?:报|于)?|closed\\s+at|finished\\s+at)\\s*('+number+')','i'));
   const open=segment.match(new RegExp('(?:开盘报|开于|开盘(?:于)?|opened\\s+at)\\s*('+number+')','i'));
   if(!!close===!!open)continue;
   const level=close??open,value=Number(level[1].replaceAll(',',''));
   const tail=segment.slice(level.index+level[0].length).split(/[。\n]/)[0];
   const pct=tail.match(/(上涨|上升|涨|下跌|下降|跌|up|down)\s*(\d+(?:\.\d+)?)\s*[%％]/i);
   const changePercent=pct?Number(pct[2])*(/跌|下降|down/i.test(pct[1])?-1:1):undefined;
   const evidence=text.slice(Math.max(0,index-60),Math.min(index+segment.length,index+250));
   const observation=normalizeObservation({...item,value,session:close?'close':'open',tradingDate,timeZone:MARKET_TIME_ZONES[item.group],timestampPrecision:'date',provenance:'report',currency:'NONE',unit:'点',sourcePublishedAt:report.publishedAt,sourceUrl:report.url,evidence,valuePrecision:level[1].split('.')[1]?.length??0,...(changePercent===undefined?{}:{changePercent})},policy,now);
   if(!observations.some(o=>o.id===observation.id))observations.push(observation);
  }
  return observations;
 }catch{return [];}
}
