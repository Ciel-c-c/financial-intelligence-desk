import {normalizeInstrument} from './market-adapters.mjs';
import {assertSourceReviewCurrent} from './source-registry.mjs';
import {validateObservation,validTradingDate} from '../../src/data/marketObservationValidation.mjs';
export {validateObservation};
export function normalizeObservation(raw,source,fetchedAt){
 assertSourceReviewCurrent(source,new Date(fetchedAt));
 const url=new URL(raw.sourceUrl??source.baseUrl);
 if(url.protocol!=='https:'||url.username||url.password||url.port||!source.allowedHosts.includes(url.hostname)
  ||!source.allowedPathPatterns?.some(pattern=>new RegExp(pattern).test(url.pathname))||!source.markets.includes(raw.group))throw Error('source policy mismatch');
 if(!['report-facts','quote-display','reference-display'].includes(source.usageMode)
  ||source.usageMode!==({report:'report-facts',quote:'quote-display',reference:'reference-display'})[raw.provenance])throw Error('source use not approved');
 if(!validTradingDate(raw.tradingDate))throw Error('explicit valid trading date required');
 const timestamp=raw.timestampPrecision==='date'?raw.tradingDate+'T00:00:00.000Z':raw.timestamp;
 const o={...normalizeInstrument({...raw,timestamp,marketState:raw.session==='close'?'close':'delayed'},source,fetchedAt),
  session:raw.session,tradingDate:raw.tradingDate,timeZone:raw.timeZone,timestampPrecision:raw.timestampPrecision,provenance:raw.provenance,
  ...(raw.sourcePublishedAt===undefined?{}:{sourcePublishedAt:new Date(raw.sourcePublishedAt).toISOString()}),valuePrecision:raw.valuePrecision,
  ...(raw.evidence?{evidence:raw.evidence}:{}),...(raw.changePercent!==undefined?{changeBasis:'source'}:{})};
 if(!validateObservation(o,fetchedAt))throw Error('invalid market observation');
 return o;
}
