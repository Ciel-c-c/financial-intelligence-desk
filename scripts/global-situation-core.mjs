import { createHash } from 'node:crypto';

const CRITERIA = ['energySupply','tradeSupplyChain','inflation','growth','centralBank','fiscalPolicy','earnings','capitalFlows','riskAppetite','marketReaction'];
const STOP_WORDS = new Set(['the','a','an','and','or','to','of','in','on','for','after','following','its','policy','meeting']);

const rules = [
  {
    eventType: 'energy-security', region: 'middle-east',
    test: /\b(oil|opec|energy|shipping|strait|gulf|pipeline|tanker|crude|lng|electricity)\b|red sea/i,
    criteria: ['energySupply','tradeSupplyChain','inflation','growth','earnings','riskAppetite'],
    knowledgeIds: ['geopolitics','supply-demand','cpi','trade'],
  },
  {
    eventType: 'geopolitical-conflict', region: 'global',
    test: /\bsanction(s|ed)?\b|\bceasefire\b|military escalation|\b(war|conflict)\b.{0,120}\b(oil|shipping|energy|trade|supply)\b/i,
    criteria: ['tradeSupplyChain','growth','fiscalPolicy','capitalFlows','riskAppetite'],
    knowledgeIds: ['geopolitics','probability','trade','drawdown'],
  },
  {
    eventType: 'trade-policy', region: 'global',
    test: /tariff|trade restriction|export control|sanction|semiconductor|chip|customs|import duty/i,
    criteria: ['tradeSupplyChain','inflation','growth','earnings','capitalFlows','riskAppetite'],
    knowledgeIds: ['trade','elasticity','exchange-rate','geopolitics'],
  },
  {
    eventType: 'monetary-policy', region: 'global',
    test: /interest rate|policy rate|monetary policy|inflation|fomc|\bfed\b.{0,60}\brates?\b|federal reserve.{0,60}\brates?\b/i,
    criteria: ['inflation','growth','centralBank','earnings','capitalFlows','riskAppetite'],
    knowledgeIds: ['interest-rate','bonds','cpi','valuation','exchange-rate'],
  },
  {
    eventType: 'fiscal-policy', region: 'global',
    test: /budget|fiscal policy|government spending|stimulus|tax cut|tax increase|public debt|treasury/i,
    criteria: ['inflation','growth','centralBank','fiscalPolicy','earnings','capitalFlows'],
    knowledgeIds: ['fiscal-multiplier','public-debt','bonds','cpi'],
  },
  {
    eventType: 'political-transition', region: 'global',
    test: /election|government (formation|change|transition)|parliament|coalition|president|prime minister/i,
    criteria: ['growth','fiscalPolicy','earnings','capitalFlows','riskAppetite'],
    knowledgeIds: ['elections','probability','geopolitics'],
  },
];

const regionRules = [
  ['united-states', /federal reserve|\bfed\b|united states|u\.s\.|american|white house|treasury/i],
  ['china', /china|chinese|pboc|beijing|yuan|renminbi/i],
  ['europe', /ecb|euro area|european union|europe|eurozone/i],
  ['europe', /ukraine|russia|bank of england|\bboe\b|united kingdom/i],
  ['japan', /bank of japan|boj|japan|yen/i],
  ['middle-east', /middle east|gulf|red sea|hormuz|iran|israel|opec/i],
];

function decodeXml(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

function tag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (match) return decodeXml(match[1]);
  }
  return '';
}

function linkFrom(block) {
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  return atom?.[1] ? decodeXml(atom[1]) : tag(block, ['link','guid']);
}

function toIso(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? fallback : date.toISOString();
}

export function parseFeed(xml, source, fetchedAt = new Date().toISOString()) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(match => match[2]);
  return blocks.map(block => ({
    headline: tag(block, ['title']),
    summary: tag(block, ['description','summary','content']),
    source: source.name,
    sourceUrl: linkFrom(block) || source.url,
    publishedAt: toIso(tag(block, ['pubDate','published','updated','dc:date']), fetchedAt),
    fetchedAt,
  })).filter(item => item.headline && /^https?:\/\//.test(item.sourceUrl));
}

export function scoreMarketRelevance(criteria) {
  const score = new Set(criteria.filter(item => CRITERIA.includes(item))).size;
  return { level: score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low', score };
}

export function classifyItem(item) {
  const text = `${item.headline} ${item.summary}`;
  if (/warning against scams?|school|education|human rights|households face|global trust|invest in peace/i.test(text)) {
    return { ...item, region:'global', eventType:'other', relevance:{ ...scoreMarketRelevance([]), criteria:[] }, knowledgeIds:[] };
  }
  const rule = (/election|parliament|coalition|government (formation|change|transition)/i.test(text) ? rules.find(candidate => candidate.eventType === 'political-transition') : undefined) ?? rules.find(candidate => candidate.test.test(text)) ?? {
    eventType: 'economic-policy', region: 'global', criteria: ['growth'], knowledgeIds: ['gdp','expectations'],
  };
  const detectedRegion = regionRules.find(([, pattern]) => pattern.test(`${text} ${item.source}`))?.[0] ?? rule.region;
  let criteria = [...rule.criteria];
  if (rule.eventType === 'monetary-policy' && !/fomc statement|monetary policy decisions?|interest rate decision|policy rate|\b(raise|raises|raised|cut|cuts|keeps|kept|hold|holds|held)\b.{0,35}\brates?\b/i.test(text)) {
    criteria = ['inflation','growth','centralBank','capitalFlows'];
  }
  if (rule.eventType === 'energy-security' && !/\b(oil|opec|shipping|tanker|crude|lng|war|conflict|attack)\b|red sea|strait/i.test(text)) {
    criteria = ['energySupply','growth','earnings'];
  }
  return { ...item, region: detectedRegion, eventType: rule.eventType, relevance: { ...scoreMarketRelevance(criteria), criteria }, knowledgeIds: rule.knowledgeIds };
}

function titleTokens(value) {
  return new Set(value.toLowerCase().replace(/federal reserve/g, 'fed').replace(/interest rates?/g, 'rates').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(token => token.length > 2 && !STOP_WORDS.has(token)));
}

function similarity(a, b) {
  const one = titleTokens(a); const two = titleTokens(b);
  const shared = [...one].filter(token => two.has(token)).length;
  const union = new Set([...one, ...two]).size;
  return union ? shared / union : 0;
}

export function clusterEvents(items) {
  const sorted = [...items].sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const clusters = [];
  for (const raw of sorted) {
    const item = raw.relevance ? raw : classifyItem(raw);
    const found = clusters.find(cluster => cluster.region === item.region && cluster.eventType === item.eventType && Math.abs(new Date(cluster.publishedAt) - new Date(item.publishedAt)) <= 72 * 3600_000 && similarity(cluster.headline, item.headline) >= 0.45);
    const source = { name: item.source, url: item.sourceUrl, publishedAt: item.publishedAt };
    if (found) {
      if (!found.sources.some(existing => existing.url === source.url)) found.sources.push(source);
      continue;
    }
    clusters.push({ ...item, sources: [source] });
  }
  return clusters;
}

const narratives = {
  'energy-security': {
    oneLine: '能源或运输出现不确定性，市场先担心未来会不会供不应求。',
    why: '石油和运输像经济的血液。它们变贵，会让飞机、卡车、工厂和家庭一起多花钱。',
    example: '想象每天需要 100 桶油，大家忽然担心以后只能运到 90 桶。即使今天还没真的少 10 桶，买家也可能提前抢油，价格便会先动。',
    professional: '专业一点说，市场正在为潜在供应中断加入风险溢价。',
    chain: [
      ['运输或供应风险上升','可用能源可能减少，买家会更早锁定货源。','风险持续且替代路线有限'],
      ['原油与运费可能上涨','更少的供给追逐相近的需求，价格容易上升。','库存和备用产能不足以抵消'],
      ['企业成本可能增加','航空、物流、化工和制造业都需要能源。','企业无法完全用效率或合同锁价吸收'],
      ['通胀压力可能升高','企业可能把部分成本转到商品和服务价格。','需求仍能承受提价'],
      ['降息空间可能缩小','央行会担心价格压力扩散。','通胀持续而增长尚未明显崩弱'],
    ],
    assets: [['原油','供应中断概率直接影响每桶油的边际价格。'],['黄金','风险偏好下降时资金可能寻找避险，但实际利率上升会削弱吸引力。'],['航空股','燃油是重要成本；票价无法同步上涨时利润可能下降。'],['能源股','油价走高可能增加收入，但税费、成本和产量决定利润。']],
    conditions: ['停火或紧张局势缓和','关键航线恢复正常','OPEC 或其他产油国增产','释放战略石油储备','全球需求明显下降','实际供应未受影响'],
  },
  'monetary-policy': {
    oneLine: '央行正在改变或解释“借钱的价格”，这会影响贷款、债券和股票估值。',
    why: '利率像资金的租金。租金变高，企业借钱扩张更贵，未来利润折算到今天也会变少。',
    example: '你明年收到 100 元。若安全存款一年能赚 2 元，今天为这 100 元支付的价格会高一些；若能赚 8 元，你会要求更低的今天价格。',
    professional: '专业一点说，市场在重估政策路径、贴现率和风险溢价。',
    chain: [['央行信号变化','投资者调整未来利率预期。','后续数据没有推翻该信号'],['债券收益率可能变化','新利率预期进入债券价格。','信用和期限溢价没有反向抵消'],['融资成本可能变化','银行和债券市场重新给贷款定价。','政策能传导到实体融资'],['股票估值可能重算','远期现金流对贴现率敏感。','盈利预期没有同时大幅变化']],
    assets: [['国债收益率','它最直接反映政策、通胀和期限补偿。'],['美元','相对利率会改变持有不同货币的吸引力。'],['Nasdaq','许多成长公司的价值来自更远期利润，对贴现率更敏感。'],['银行股','利率影响息差、贷款需求和坏账风险，方向取决于三者合力。']],
    conditions: ['通胀数据明显转向','就业或增长意外走弱','央行官员给出不同信号','金融压力让银行收紧贷款','市场已经提前充分定价'],
  },
  'trade-policy': {
    oneLine: '跨境买卖的规则或成本在变化，企业需要重新算供应链和利润。',
    why: '关税和出口限制会让某些零件更贵、更难买，企业要在涨价、少赚或换供应商之间选择。',
    example: '一家玩具店用 80 元进口玩具，卖 100 元。若边境成本增加 10 元，它只能提价、少赚 10 元，或寻找新工厂。',
    professional: '专业一点说，贸易壁垒会改变成本转嫁、比较优势和供应链配置。',
    chain: [['贸易规则收紧','进口或出口的手续、税费或许可增加。','措施真正生效且执行'],['跨境成本可能上升','企业需要缴费、绕行或更换供应商。','没有及时获得豁免或替代'],['物价与利润重新分配','消费者、进口商和出口商分担成本。','需求弹性与议价能力不同'],['投资地点可能改变','企业评估把产能移到更安全的市场。','政策预计持续足够久']],
    assets: [['半导体股','出口许可与设备限制会影响订单和扩产。'],['工业股','零部件成本和海外需求会改变利润。'],['美元与人民币','贸易流和资本避险会影响货币需求。'],['航运股','提前出货、绕行和贸易量变化都会影响运价。']],
    conditions: ['豁免范围扩大','谈判达成协议','汇率抵消部分成本','企业找到替代供应','需求下降导致企业无法提价'],
  },
};

function narrativeFor(type) {
  return narratives[type] ?? {
    oneLine: '一项政策或政治变化正在改变增长、成本或资金流的预期。',
    why: '市场关心的不是标题本身，而是它会不会改变企业赚多少钱、借钱多贵以及投资者愿意承担多少风险。',
    example: '像家庭重新做预算：收入、利息或必要开支变了，能用于其他事情的钱也会跟着变。',
    professional: '专业一点说，市场正在重估现金流、贴现率与风险溢价。',
    chain: [['政策或事件发生','已确认的信息进入市场。','来源和细节可靠'],['预期可能改变','投资者重新估计增长、成本或风险。','影响具有经济规模'],['资产重新定价','买卖双方调整愿意接受的价格。','新信息尚未被完全计价']],
    assets: [['全球股票','盈利与风险偏好共同决定影响。'],['国债','增长、通胀和政策预期会进入收益率。'],['美元','资本流与相对利率会改变需求。']],
    conditions: ['政策没有真正执行','影响范围小于预期','出现方向相反的新数据','市场此前已经充分定价'],
  };
}

function eventId(item) {
  return createHash('sha1').update(`${item.region}|${item.eventType}|${[...titleTokens(item.headline)].sort().join('-')}`).digest('hex').slice(0, 12);
}

function localizeHeadline(item) {
  const title = item.headline;
  const matches = [
    [/monetary policy decisions?/i,'欧洲央行公布最新货币政策决定'],
    [/Christine Lagarde.*monetary policy statement/i,'欧洲央行公布货币政策声明与问答'],
    [/Federal Reserve issues FOMC statement/i,'美联储发布最新 FOMC 声明'],
    [/Speech by Board Member.*Economic Activity, Prices, and Monetary Policy/i,'日本央行委员就经济、物价与货币政策发表讲话'],
    [/Listening to households.*monetary policy/i,'欧洲央行讨论家庭预期、行为与货币政策'],
    [/Average Contract Interest Rates on Loans/i,'日本公布贷款与贴现合同平均利率'],
    [/Fresh attacks.*Yemen/i,'也门与红海局势出现新一轮升级'],
    [/Ships and seafarers.*wars/i,'战争冲突对国际航运与船员安全的影响上升'],
    [/AI datacentres.*electricity systems/i,'AI 数据中心给全球电力系统带来更大压力'],
    [/Libya election deal/i,'利比亚选举安排取得新进展'],
  ];
  return matches.find(([pattern]) => pattern.test(title))?.[1] ?? title;
}

function toEvent(item) {
  const narrative = narrativeFor(item.eventType);
  return {
    id: eventId(item), headline: localizeHeadline(item), sourceHeadline:item.headline, oneLine: narrative.oneLine,
    summary: item.summary || narrative.oneLine,
    publishedAt: item.publishedAt, fetchedAt: item.fetchedAt,
    region: item.region, topic: item.eventType, eventType: item.eventType,
    relevance: item.relevance,
    fact: [item.summary || `官方来源发布：${item.headline}`],
    marketView: [narrative.why, narrative.professional],
    scenarios: [`如果相关影响继续，${narrative.chain.at(-1)[0]}。这是一种有条件的路径。`],
    simpleExample: narrative.example, professionalConcept: narrative.professional,
    causalChain: narrative.chain.map(([title, beginnerExplanation, condition], index) => ({ id: `${index + 1}`, title, beginnerExplanation, condition, uncertain: index > 0 })),
    relatedAssets: narrative.assets.map(([name, explanation]) => ({ name, explanation })),
    relatedIndustries: item.eventType === 'energy-security' ? ['能源','航空','航运','化工'] : item.eventType === 'trade-policy' ? ['半导体','工业制造','零售','航运'] : ['银行','房地产','科技','可选消费'],
    knowledgeIds: item.knowledgeIds,
    relatedKnowledgePoints: item.knowledgeIds,
    conditionsThatChangeView: narrative.conditions,
    marketReaction: [],
    sources: item.sources,
  };
}

export function buildSnapshot({ attemptedAt, sourceResults, previous }) {
  const successful = sourceResults.filter(result => result.ok);
  const failed = sourceResults.filter(result => !result.ok);
  const sourceHealth = sourceResults.map(result => ({ id: result.id, name: result.name, status: result.ok ? 'ok' : 'error', itemCount: result.items.length, error: result.error }));
  if (!successful.length) return { ...(previous ?? { schemaVersion: 1, events: [] }), attemptedAt, status: 'source_error', sourceHealth };
  const events = clusterEvents(successful.flatMap(result => result.items)).map(toEvent).filter(event => event.relevance.level !== 'low').slice(0, 12);
  return { schemaVersion: 1, attemptedAt, lastSuccessfulAt: attemptedAt, status: failed.length ? 'partial' : 'latest', sourceHealth, events };
}
