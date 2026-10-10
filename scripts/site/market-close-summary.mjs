import {validateObservation,dateInZone,MARKET_TIME_ZONES} from '../../src/data/marketObservationValidation.mjs';
import {isPublishableNews} from '../../src/data/newsEditorialValidation.mjs';
import {buildSourcePolicies,isSourceAllowed} from '../news/source-policy.mjs';
import {newsSources} from '../news/source-registry.mjs';
import {articleHash} from '../news/full-article.mjs';
import {EDITORIAL_REVIEW_VERSION} from '../news/editorial-audit.mjs';
import {INSTRUMENT_CATALOG} from './market-report-parser.mjs';
const regions={aShare:['中国','A股'],hongKong:['香港','港股'],us:['美国','美股'],globalAssets:['全球']};
export function reconcileMarketSummaries({market,news,now}){
 const sessionSummary={};
 const rows=[...(news?.latest??[]),...(news?.continuing??[])];
 for(const group of Object.keys(MARKET_TIME_ZONES)){
  const closes=(market.groups[group]??[]).filter(o=>o.session==='close'),tradingDate=closes.map(o=>o.tradingDate).sort().at(-1);
  if(tradingDate)sessionSummary[group]=buildMarketCloseSummary({group,tradingDate,observations:closes,news:rows,now});
 }
 return {...market,sessionSummary};
}
export function buildMarketCloseSummary({group,tradingDate,observations=[],news=[],now}){
 const items=observations.filter(o=>o.group===group&&o.tradingDate===tradingDate&&o.session==='close'&&validateObservation(o,now));
 const facts=items.map(o=>o.name+'收于'+o.value.toLocaleString('zh-CN',{minimumFractionDigits:o.valuePrecision,maximumFractionDigits:o.valuePrecision})+o.unit+(o.changePercent===undefined?'，涨跌幅未提供':o.changePercent===0?'，持平':'，'+(o.changePercent>0?'上涨':'下跌')+Math.abs(o.changePercent).toFixed(2)+'%')+'。');
 const explanations=[],watchItems=[],invalidationConditions=[],policies=buildSourcePolicies(newsSources,now),seen=new Set();
 for(const record of news){
  if(!items.length||seen.has(record.id)||!isPublishableNews(record)||!isSourceAllowed(record,policies,now)||record.editorial.generator?.review!==EDITORIAL_REVIEW_VERSION)continue;
  if(typeof record.article.text==='string'&&articleHash(record.article.text)!==record.article.sha256)continue;
  if(dateInZone(record.publishedAt,MARKET_TIME_ZONES[group])!==tradingDate||Date.parse(record.publishedAt)>Date.parse(now))continue;
  if(!regions[group].some(region=>record.regions?.includes(region)||record.editorial.item.region===region)||!record.impactChannels?.some(channel=>['利率','估值','盈利','供需','汇率','政策'].includes(channel)))continue;
  const source=(record.originalTitle+' '+(record.article.text??record.originalSummary??'')).toLowerCase();
  if(!items.some(o=>INSTRUMENT_CATALOG.find(i=>i.id===o.id)?.aliases.some(alias=>source.includes(alias.toLowerCase()))))continue;
  const text=record.editorial.item.consensus.find(value=>!/^暂无|^未提供/.test(value));if(!text)continue;
  seen.add(record.id);explanations.push({newsId:record.id,text,sourceUrl:record.canonicalUrl,conditional:true,attribution:'机制参考，不代表已确认的当日涨跌原因'});
  watchItems.push(...record.editorial.watchItems);invalidationConditions.push(...record.editorial.item.risks);
  if(explanations.length===3)break;
 }
 return {tradingDate,session:'close',facts,explanations,watchItems:[...new Set(watchItems)].slice(0,5),invalidationConditions:[...new Set(invalidationConditions)].slice(0,5),sources:[...new Map(items.map(o=>[o.source.url,o.source])).values()]};
}
