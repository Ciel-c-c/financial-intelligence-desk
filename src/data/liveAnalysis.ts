import type { LiveNewsItem } from './newsFeedTypes';
import type { NewsItem, SoWhatData } from './types';
import { soWhatForNews } from './soWhat';

type Mechanism = { match: RegExp; analogy: string; explanation: string; nodes: string[]; why: string; focus: string[]; risk: string; termIds: string[] };
// These are conditional economic mechanisms, not a claim that a source or market
// has confirmed every step. Never infer direction from the mere presence of a term.
const mechanisms: Mechanism[] = [
  { match:/shipping|red sea|freight|红海|航运|运费/i, analogy:'像送货路线多了一段绕路。', explanation:'同样一批货，要用更多船期、燃料和库存才能送到。成本是否转给买家，取决于合同和需求。', nodes:['运输受扰或绕行','运力与交付时间可能变化','运输及库存成本可能变化','企业利润或商品价格可能受影响'], why:'运输时间和成本改变，会影响企业交付与库存占用；不是所有航运新闻都会推高油价。', focus:['绕行是否持续、哪些航线受影响','运费变化是否传到合同与利润'], risk:'如果航线很快恢复、库存充足或合同锁定运价，成本传导可能很弱。',termIds:[] },
  { match:/CPI|inflation|consumer price|通胀|消费价格/i, analogy:'像生活成本的温度计。', explanation:'读数反映一篮子商品和服务的价格变化。要结合持续性和分项，不能从一次公布直接推断涨价或降息。', nodes:['价格指标公布','实际读数与预期比较','实际购买力和定价判断可能变化','消费与企业利润可能受影响'], why:'同样的收入可以买到多少东西，取决于价格；企业能否转嫁成本，取决于需求。', focus:['本次数据相对预期如何','变化来自哪些分项、能否持续'],risk:'若变化主要来自短期能源波动或基数，不能直接推断需求趋势；尚无预期数据时不能判断超预期。',termIds:['cpi'] },
  { match:/interest rate|rate cut|rate hike|monetary|利率|降息|加息|货币政策/i, analogy:'像钱的租金可能改变了。', explanation:'借钱的价格影响投资成本，也影响持有现金和风险资产的比较。政策信号不等于每笔贷款利率立即变化。',nodes:['政策决定或信号公布','未来利率路径可能重估','企业融资与资产折现可能变化','投资及估值可能受影响'],why:'融资成本影响企业能留下多少利润，折现率影响未来利润在今天值多少。',focus:['政策与原先预期的差异','调整原因及后续利率路径'],risk:'若市场已充分计入政策，价格反应可能很小；若经济与盈利恶化，宽松也不能保证资产上涨。',termIds:['interest-rate','valuation'] },
  { match:/earnings|revenue|profit|收入|盈利|利润|财报/i, analogy:'像一家商店公布经营账本。',explanation:'卖得更多不等于留下更多钱。还要扣掉采购、工资和其他成本，并对比大家原来预计的成绩。',nodes:['业绩或经营信息公布','收入与成本结构可能变化','未来利润预期可能调整','股票估值可能重新定价'],why:'股票对应的是未来盈利能力，不是单独的销售额。',focus:['收入增长能否转化为利润','实际业绩和未来指引是否超过预期'],risk:'一次性收益、成本上升或已经很高的估值，都可能让收入增长不对应股价上涨。',termIds:['valuation','guidance'] },
  { match:/oil|crude|OPEC|石油|原油/i, analogy:'像很多行业共用的原材料价格发生变化。',explanation:'油既是能源，也影响运输和化工成本。生产者与用油企业站在成本变化的不同一侧。',nodes:['原油供需信息变化','油价预期可能调整','能源与运输成本可能变化','商品价格和企业利润可能受影响'],why:'原材料价格通过采购和运输进入成本，能否转嫁给消费者取决于需求与合同。',focus:['供给变化是否真实落地','需求与库存是否抵消供给冲击'],risk:'若需求同步走弱、库存释放或冲击早已被定价，供给消息不一定推动油价上涨。',termIds:[] },
];

export function liveAnalysis(source: LiveNewsItem): {item:NewsItem;soWhat:SoWhatData}|undefined {
  const text=[source.originalTitle,source.originalSummary,source.titleZh,source.summaryZh,...(source.keyTerms??[])].join(' ');
  const profile=mechanisms.find(p=>p.match.test(text));
  if(!profile) return undefined;
  const nodes=[...profile.nodes];
  const terms=[...profile.termIds];
  if(profile.termIds.includes('cpi') && source.impactChannels?.includes('利率')) {
    nodes.splice(2,2,'通胀持续性影响利率预期','房贷及企业融资成本可能变化','需求与估值可能受影响');
    terms.push('interest-rate');
  }
  const item:NewsItem={id:`live-analysis:${source.id}`,title:source.titleZh??source.originalTitle,region:source.regions?.includes('中国')?'A股':source.regions?.includes('美国')?'美股':'全球',topic:source.eventTypes?.includes('公司经营')?'公司经营':'宏观与经济',sourceName:source.sourceName,sourceUrl:source.sourceUrl,publishedAt:source.publishedAt,summary:source.summaryZh??source.originalSummary??'',excerpt:'',termIds:terms,facts:source.facts??[],consensus:[`常见机制参考：${profile.why}`],inference:source.inferences??[],risks:[profile.risk],causalChain:nodes.map(title=>({title,explanation:profile.why,condition:profile.risk})),mode:'今日快照'};
  const base=soWhatForNews(item);
  return {item,soWhat:{...base,analogy:{image:profile.analogy,explanation:profile.explanation},focus:profile.focus,condition:[profile.risk],marketBet:['关键变化是否持续','变化能否传到需求、成本或盈利','下一次数据是否验证判断'],personalImpact:base.personalImpact.map(impact=>({...impact,why:profile.why,condition:profile.risk}))}};
}
