const has = (text, terms) => terms.some(term=>text.includes(term.toLowerCase()));
export function classifyNewsItem(item) {
  const text = `${item.originalTitle} ${item.originalSummary??''}`.toLowerCase();
  const monetary=has(text,['利率','央行','federal reserve','ecb'])||/\binterest rates?\b/.test(text);
  const macro = monetary||has(text,['cpi','inflation','通胀','消费价格','经济'])||/\b(?:gdp|unemployment)\b/.test(text);
  const profit=has(text,['earnings','revenue','profit','营收','利润','盈利']);
  const company = profit||has(text,['公司','上市','股价','并购','裁员','管理层'])||/\b(?:companies|company|ipo|acquisition|merger|layoffs?|ceo)\b/.test(text);
  const industry=has(text,['行业','产业','芯片','能源'])||/\b(?:industr(?:y|ies)|sector|semiconductors?|chips?|energy|ai)\b/.test(text);
  const eventTypes = has(text,['cpi','inflation','消费价格','gdp','就业'])?['经济数据']:monetary?['货币政策']:company?['公司经营']:has(text,['监管','行政指导','反垄断','regulation','regulatory','antitrust'])?['监管']:[];
  const impactChannels=[]; if(has(text,['cpi','inflation','通胀','消费价格'])) impactChannels.push('通胀'); if(monetary) impactChannels.push('利率'); if(has(text,['exchange','currency','汇率','人民币','美元'])) impactChannels.push('汇率'); if(profit) impactChannels.push('盈利'); if(has(text,['供应','供给','需求','供需'])||/\b(?:supply|demand)\b/.test(text)) impactChannels.push('供需');
  const regions = item.sourceId==='nbs-cn'?['中国','A股相关','港股相关']:item.sourceId==='fed'?['美国','全球','美股相关']:item.sourceId==='ecb'?['欧洲','全球']:['全球'];
  const causalSignals=[]; if(impactChannels.includes('通胀')&&impactChannels.includes('利率')) causalSignals.push('通胀→利率预期'); if(has(text,['房贷','mortgage','房地产'])&&has(text,['利率','rate'])) causalSignals.push('利率→住房融资');
  const clusterId = `${eventTypes[0]}|${item.originalTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,'').slice(0,16)}|${item.publishedAt.slice(0,10)}`;
  return { ...item, analysisLevels:macro?['宏观']:company?['公司']:industry?['行业']:[], eventTypes, impactChannels:[...new Set(impactChannels)], regions, causalSignals, keyTerms:[...new Set([...impactChannels])], importanceScore:item.sourceTier==='official'?70:55, continuingImpactScore:eventTypes.includes('货币政策')?70:40, clusterId, detailStatus:macro||company?'professional':'brief' };
}
