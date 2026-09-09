import type { Brief, KnowledgeCardData, MarketSnapshot, NewsItem, PoliticalImpact, SectorSnapshot } from './types';

export const dataTimestamp = '2026-09-09 00:30（北京时间）';

export const markets: MarketSnapshot[] = [
  { id: 'csi300', market: 'A股', indexName: '沪深300', value: '4,126.08', changePercent: 0.62, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
  { id: 'hsi', market: '港股', indexName: '恒生指数', value: '25,418.30', changePercent: -0.31, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
  { id: 'sp500', market: '美股', indexName: '标普500', value: '6,482.10', changePercent: 0.84, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
];

export const aShareIndices: MarketSnapshot[] = [
  { id: 'shcomp', market: 'A股', indexName: '上证指数', value: '3,812.45', changePercent: 0.28, status: '已收盘', timestamp: dataTimestamp, source: '演示快照', delayed: true, mode: '演示' },
  { id: 'szcomp', market: 'A股', indexName: '深证成指', value: '12,186.30', changePercent: -0.16, status: '已收盘', timestamp: dataTimestamp, source: '演示快照', delayed: true, mode: '演示' },
  { id: 'chinext', market: 'A股', indexName: '创业板指', value: '2,648.72', changePercent: -0.54, status: '已收盘', timestamp: dataTimestamp, source: '演示快照', delayed: true, mode: '演示' },
  { id: 'csi300-focus', market: 'A股', indexName: '沪深300', value: '4,126.08', changePercent: 0.62, status: '已收盘', timestamp: dataTimestamp, source: '演示快照', delayed: true, mode: '演示' },
];

export const marketGroups: Record<string, MarketSnapshot[]> = {
  A股: aShareIndices,
  港股: [
    { id: 'hsi-main', market: '港股', indexName: '恒生指数', value: '25,317.18', changePercent: -0.38, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
    { id: 'hstech', market: '港股', indexName: '恒生科技', value: '4,454.85', changePercent: -1.61, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
    { id: 'hscei', market: '港股', indexName: '国企指数', value: '8,397.32', changePercent: -0.38, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
  ],
  美股: [
    { id: 'sp500-main', market: '美股', indexName: '标普500', value: '7,673.52', changePercent: -0.58, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
    { id: 'nasdaq', market: '美股', indexName: '纳斯达克', value: '26,421.41', changePercent: -0.32, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
    { id: 'dow', market: '美股', indexName: '道琼斯', value: '52,786.07', changePercent: -1.18, status: '已收盘', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
  ],
  全球资产: [
    { id: 'brent', market: '美股', indexName: '布伦特原油', value: '$99.07', changePercent: 2.13, status: '交易中', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
    { id: 'gold', market: '美股', indexName: '黄金', value: '$3,624', changePercent: 0.47, status: '交易中', timestamp: dataTimestamp, source: '演示快照', delayed: true, mode: '演示' },
    { id: 'ust10y', market: '美股', indexName: '美债10年收益率', value: '4.80%', changePercent: 0.27, status: '交易中', timestamp: dataTimestamp, source: '今日快照', delayed: true, mode: '今日快照' },
  ],
};

export const sectors: SectorSnapshot[] = [
  { id: 'oil-gas', name: '石油石化', changePercent: 3.18, direction: '领涨', reason: '国际油价接近100美元，市场预期上游企业销售价格和利润可能改善。', beginnerNote: '油价上涨通常先利好采油企业，但会增加航空、物流和制造业成本。', relatedNewsId: 'wall-street-oil-pressure' },
  { id: 'coal', name: '煤炭', changePercent: 2.36, direction: '上涨', reason: '能源价格走高带动替代能源关注度，资金流向高股息资源板块。', beginnerNote: '高股息是公司把较多利润分给股东，但股息不代表股价不会下跌。' },
  { id: 'auto', name: '汽车整车', changePercent: 1.42, direction: '上涨', reason: '出口数据较强，汽车是增长较快的出口品类之一。', beginnerNote: '出口增长可能增加车企收入，还要观察价格战和利润率。', relatedNewsId: 'china-exports-august' },
  { id: 'banks', name: '银行', changePercent: 0.76, direction: '上涨', reason: '市场风险偏好偏弱时，资金倾向估值较低、分红相对稳定的板块。', beginnerNote: '银行股常被视为防守板块，但仍受利率、坏账和经济周期影响。' },
  { id: 'consumer', name: '食品饮料', changePercent: -0.38, direction: '下跌', reason: '资金转向能源板块，消费修复仍需更多收入和需求数据确认。', beginnerNote: '消费股主要看居民愿不愿意花钱，以及公司能否提价。' },
  { id: 'semiconductor', name: '半导体', changePercent: -1.12, direction: '下跌', reason: '利率预期和风险偏好压制高估值成长板块，前期涨幅也带来获利了结。', beginnerNote: '好行业不等于每天上涨；估值过高时，小利空也可能造成较大波动。', relatedNewsId: 'asia-oil-bonds' },
  { id: 'software', name: '软件开发', changePercent: -1.67, direction: '下跌', reason: '成长股对资金成本更敏感，市场暂时偏好盈利稳定的价值板块。', beginnerNote: '利率越高，遥远未来的利润折算到今天通常越不值钱。' },
  { id: 'solar', name: '光伏设备', changePercent: -2.21, direction: '领跌', reason: '市场继续担心供给过剩、产品降价和企业盈利压力。', beginnerNote: '销量增长若伴随价格下跌，公司收入和利润未必同步增长。' },
];

export const politicalImpacts: PoliticalImpact[] = [
  {
    id: 'middle-east-energy', event: '中东冲突升级，能源设施与运输安全受关注', type: '地缘政治', status: '高关注',
    channel: '供应中断预期推高油价，再通过企业成本和通胀影响央行利率判断。',
    affected: ['石油石化 ↑', '航空运输 ↓', '化工成本 ↑', '成长股估值承压'],
    watch: '布伦特油价、航运路线、冲突是否扩大、主要产油国表态。',
    counterRisk: '若局势缓和或产油国增产，油价和相关交易可能快速反转。', newsId: 'wall-street-oil-pressure',
  },
  {
    id: 'china-trade-policy', event: '中国出口增长，市场评估外需与贸易政策变化', type: '经济政策', status: '关注',
    channel: '外需增加带动制造业订单，但关税、汇率和贸易限制会影响利润兑现。',
    affected: ['汽车出口 ↑', '电子制造 ↑', '港口物流 ↑', '人民币汇率'],
    watch: '后续出口订单、主要贸易伙伴政策、企业利润率和人民币走势。',
    counterRisk: '单月增长可能包含提前出货，不能直接外推全年趋势。', newsId: 'china-exports-august',
  },
];

export const news: NewsItem[] = [
  {
    id: 'nvidia-results', title: '芯片公司业绩增长，AI 投资热度仍在', region: '美股', topic: '公司',
    sourceName: '公司投资者关系网站（示例）', sourceUrl: 'https://investor.nvidia.com/', publishedAt: '2026-09-08 07:20',
    summary: '演示场景：大型芯片公司的收入与指引好于市场此前预期，说明云厂商对 AI 基础设施的投入仍较积极。',
    excerpt: '这是为了展示术语标注与事件解读而编写的演示文字，不是新闻原文。公司表示数据中心业务需求保持增长。',
    termIds: ['guidance', 'valuation'],
    facts: ['演示数据中的公司收入高于上一期。', '公司给出了下一季度经营指引。'],
    consensus: ['演示共识：需求强劲通常有利于芯片产业链，但市场也会比较结果与此前已经很高的预期。'],
    inference: ['如果订单继续增长，上游设备和存储供应商的收入可能随后改善。'],
    risks: ['高估值意味着即使业绩增长，只要不及投资者的高预期，股价也可能下跌。'],
    causalChain: [
      { title: '云厂商增加 AI 投资', explanation: '公司购买更多服务器与芯片。', condition: '资本开支预算真正落地。' },
      { title: '芯片订单上升', explanation: '供应商收入可能增加。', condition: '产能、交付和客户需求没有明显转弱。' },
      { title: '相关股票重新定价', explanation: '投资者可能愿意支付更高价格。', condition: '增长超过市场原先预期，而不只是符合预期。' },
    ], mode: '演示',
  },
  {
    id: 'china-cpi', title: '物价数据温和，市场关注消费修复节奏', region: 'A股', topic: '宏观',
    sourceName: '国家统计局', sourceUrl: 'https://www.stats.gov.cn/', publishedAt: '2026-09-08 06:45',
    summary: '演示场景：居民消费价格温和变化，投资者会据此判断需求、企业定价能力和政策空间。',
    excerpt: '这是演示文字。物价数据需要结合基数、食品能源价格与核心通胀一起看，单个月份不能说明完整趋势。',
    termIds: ['cpi'], facts: ['演示 CPI 数据较上月小幅变化。'], consensus: ['演示共识：温和通胀给政策保留空间。'],
    inference: ['若消费需求持续改善，消费与服务企业收入可能受益。'], risks: ['价格偏弱也可能反映需求不足，不能简单理解为利好。'],
    causalChain: [
      { title: '物价温和', explanation: '生活成本没有快速上升。', condition: '核心价格也保持稳定。' },
      { title: '政策空间变化', explanation: '央行和财政政策可更关注增长。', condition: '汇率和金融风险允许。' },
      { title: '企业盈利受影响', explanation: '需求和定价能力会改变公司收入。', condition: '居民收入和信心同步改善。' },
    ], mode: '演示',
  },
  {
    id: 'hongkong-rates', title: '利率预期变化，港股成长板块波动加大', region: '港股', topic: '市场',
    sourceName: '香港交易所市场资料（示例）', sourceUrl: 'https://www.hkex.com.hk/', publishedAt: '2026-09-08 06:10',
    summary: '演示场景：海外利率预期影响港股的资金成本和估值，成长类公司通常更敏感。',
    excerpt: '这是演示文字。利率变化只是市场驱动因素之一，公司盈利、资金流与风险偏好也会同时作用。',
    termIds: ['interest-rate', 'valuation'], facts: ['演示市场中的长期利率预期发生变化。'],
    consensus: ['演示共识：利率下降通常减轻高估值资产的折现压力。'], inference: ['成长板块估值可能获得支持。'],
    risks: ['若利率下降来自经济明显走弱，盈利下调可能抵消估值利好。'],
    causalChain: [
      { title: '利率预期下降', explanation: '未来资金的价值折损得更少。', condition: '通胀受控且政策确实转松。' },
      { title: '估值压力减轻', explanation: '远期利润折算到今天会更值钱。', condition: '公司盈利预测没有下调。' },
      { title: '成长股可能受益', explanation: '投资者可能提高愿意支付的价格。', condition: '风险偏好没有同步恶化。' },
    ], mode: '演示',
  },
  {
    id: 'wall-street-oil-pressure', title: '油价逼近100美元，美股三大指数收跌', region: '美股', topic: '市场',
    sourceName: 'Associated Press', sourceUrl: 'https://apnews.com/article/d3d6157a534584985987f828a940cffa', publishedAt: '2026-09-09 04:21',
    summary: '中东冲突推高能源价格，市场担心通胀重新升温。标普500跌0.6%，道指跌1.2%，纳指跌0.3%。',
    excerpt: 'AP 报道显示，布伦特原油盘中接近每桶99.50美元。能源成本上升会影响家庭支出、企业成本和央行利率判断。',
    termIds: ['cpi', 'interest-rate'], facts: ['美股三大指数在9月8日收跌。', '布伦特原油价格盘中接近100美元。'],
    consensus: ['能源价格持续上涨通常会增加通胀压力，并让降息变得更困难。'], inference: ['航空、运输和消费行业可能面临更高成本，能源生产商收入可能受益。'],
    risks: ['油价可能因冲突缓和或供应恢复快速回落，市场影响并非单向。'],
    causalChain: [
      { title: '冲突影响能源供应', explanation: '市场担心原油运输和生产受阻。', condition: '紧张局势持续。' },
      { title: '油价与成本上升', explanation: '运输、制造和生活成本可能提高。', condition: '企业无法通过效率提升抵消成本。' },
      { title: '通胀与利率预期上升', explanation: '央行可能更谨慎地降息。', condition: '高油价传导到更广泛商品和服务。' },
    ], mode: '今日快照',
  },
  {
    id: 'china-exports-august', title: '中国8月出口同比增长25%，汽车与高科技产品需求较强', region: 'A股', topic: '宏观',
    sourceName: 'Associated Press', sourceUrl: 'https://apnews.com/article/d3d6157a534584985987f828a940cffa', publishedAt: '2026-09-08 18:00',
    summary: '出口增速较快，说明外需对制造业仍有支撑；市场会继续观察订单能否持续，以及贸易与汇率变化。',
    excerpt: '报道援引中国公布的数据称，8月出口同比增长25%，汽车和高科技产品需求是主要推动因素。',
    termIds: ['valuation'], facts: ['报道所列8月出口同比增长25%。'], consensus: ['出口增长通常支持制造业订单、就业和企业收入。'],
    inference: ['汽车、电子和相关供应链可能获得基本面支持。'], risks: ['单月高增长可能受基数、提前出货或价格因素影响。'],
    causalChain: [
      { title: '海外订单增加', explanation: '外国买家购买更多中国产品。', condition: '需求不是短期提前释放。' },
      { title: '制造业收入改善', explanation: '出口企业获得更多订单和现金流。', condition: '汇率和原材料成本可控。' },
      { title: '产业链可能受益', explanation: '零部件、物流和设备需求可能增加。', condition: '订单能传导到利润。' },
    ], mode: '今日快照',
  },
  {
    id: 'hongkong-close-lower', title: '恒生指数收跌0.38%，恒生科技指数跌1.61%', region: '港股', topic: '市场',
    sourceName: '新华社 / 中国网', sourceUrl: 'https://www.china.org.cn/china/Off_the_Wire/2026-09/08/content_118685854.shtml', publishedAt: '2026-09-08 16:30',
    summary: '港股主要指数走弱，科技板块跌幅更大，反映成长股对利率、资金成本和风险偏好的变化更敏感。',
    excerpt: '恒生指数收于25,317.18点，恒生中国企业指数跌0.38%，恒生科技指数跌1.61%。',
    termIds: ['interest-rate', 'valuation'], facts: ['恒生指数9月8日收跌0.38%。', '恒生科技指数跌1.61%。'],
    consensus: ['科技股估值通常对利率和资金流变化较敏感。'], inference: ['若海外利率继续上行，高估值成长股波动可能维持较高水平。'],
    risks: ['单日涨跌不能代表趋势，公司盈利与后续资金流可能改变方向。'],
    causalChain: [
      { title: '风险偏好下降', explanation: '投资者减少高波动资产配置。', condition: '外部不确定性持续。' },
      { title: '成长股估值承压', explanation: '未来利润折算到今天的价值降低。', condition: '利率预期同时上升。' },
      { title: '科技指数跌幅扩大', explanation: '板块权重股同步走弱。', condition: '缺少盈利利好对冲。' },
    ], mode: '今日快照',
  },
  {
    id: 'new-york-fed-expectations', title: '纽约联储：中期通胀预期下降，就业担忧上升', region: '全球', topic: '经济',
    sourceName: '纽约联邦储备银行', sourceUrl: 'https://www.newyorkfed.org/press', publishedAt: '2026-09-08 22:00',
    summary: '消费者对未来通胀的担忧有所缓和，但对失业的担忧增加，显示经济预期中同时存在“价格改善”和“增长放缓”。',
    excerpt: '纽约联储9月8日发布调查结果，指出中期通胀预期下降，而失业预期恶化。',
    termIds: ['cpi', 'interest-rate'], facts: ['纽约联储发布了最新消费者预期调查。'],
    consensus: ['通胀预期下降有助于稳定物价，但就业担忧会影响消费信心。'], inference: ['债券和利率敏感资产可能更关注增长放缓信号。'],
    risks: ['消费者调查是预期指标，不等于之后公布的实际通胀或就业数据。'],
    causalChain: [
      { title: '通胀预期下降', explanation: '家庭预计价格上涨速度可能放缓。', condition: '实际能源和服务价格不再加速。' },
      { title: '就业担忧上升', explanation: '家庭可能减少非必要消费。', condition: '担忧转化为真实招聘放缓。' },
      { title: '政策判断更复杂', explanation: '央行需要同时考虑通胀和增长。', condition: '后续官方数据印证调查。' },
    ], mode: '今日快照',
  },
  {
    id: 'asia-oil-bonds', title: '油价和债券收益率上升，亚洲股市承压', region: '全球', topic: '市场',
    sourceName: 'Dow Jones / Yahoo Finance', sourceUrl: 'https://finance.yahoo.com/markets/world-indices/articles/higher-oil-prices-bond-yields-104456376.html', publishedAt: '2026-09-08 18:44',
    summary: '香港和东京市场下跌、上海小幅上涨。油价与债券收益率同时上升，压低投资者愿意为未来盈利支付的估值。',
    excerpt: '报道显示，MSCI亚太指数当日下跌0.8%，布伦特原油在亚洲交易时段上涨至每桶98美元以上。',
    termIds: ['interest-rate', 'valuation'], facts: ['报道所列MSCI亚太指数下跌0.8%。'],
    consensus: ['高油价和高收益率通常同时压制股票估值。'], inference: ['能源进口依赖较高的市场和行业可能更敏感。'],
    risks: ['不同市场产业结构不同，能源股上涨可能抵消部分指数压力。'],
    causalChain: [
      { title: '能源与融资成本上升', explanation: '企业经营和借款都变贵。', condition: '高价格持续。' },
      { title: '利润与估值预期下调', explanation: '投资者重新估算公司价值。', condition: '企业无法转嫁成本。' },
      { title: '亚洲股市承压', explanation: '资金更偏好现金或低风险资产。', condition: '风险偏好继续走弱。' },
    ], mode: '今日快照',
  },
];

export const knowledge: KnowledgeCardData[] = [
  { id: 'cpi', term: 'CPI', definition: '居民购买一篮子常见商品和服务时，价格整体变化了多少。', example: '同样一篮子菜去年100元、今年102元，价格大约上涨2%。', misconception: 'CPI 下降不一定代表所有东西都降价，也可能只是上涨得更慢。' },
  { id: 'interest-rate', term: '利率', definition: '借钱要支付的价格，也是资金的时间成本。', example: '房贷利率下降时，每月利息负担通常会减少。', misconception: '降息并不保证股票上涨，经济走弱也可能同时压低企业利润。' },
  { id: 'valuation', term: '估值', definition: '市场愿意为公司未来赚钱能力支付多少价格。', example: '两家公司都赚1元，股价分别为10元和30元，市场给它们的估值不同。', misconception: '低估值不等于一定便宜，可能反映业务风险较高。' },
  { id: 'guidance', term: '业绩指引', definition: '公司管理层对未来一段时间收入或利润的预期。', example: '公司说下季度收入可能在100亿元上下，这就是指引。', misconception: '指引是预测，不是已经发生的事实。' },
];

export const brief: Brief = {
  date: '2026-09-09', generatedAt: dataTimestamp, headline: '油价接近100美元，通胀与利率重新成为全球市场主线',
  newsIds: ['wall-street-oil-pressure', 'china-exports-august', 'hongkong-close-lower'],
  watchItems: ['观察油价是否继续向消费和企业成本传导。', '关注中国出口增长能否转化为制造业利润。', '留意美国通胀数据对下周利率决定的影响。'],
  knowledgeId: 'interest-rate', mode: '演示',
};
