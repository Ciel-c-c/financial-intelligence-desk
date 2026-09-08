import type { Brief, KnowledgeCardData, MarketSnapshot, NewsItem } from './types';

export const dataTimestamp = '2026-09-08 08:30（北京时间）';

export const markets: MarketSnapshot[] = [
  { id: 'csi300', market: 'A股', indexName: '沪深300', value: '4,126.08', changePercent: 0.62, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
  { id: 'hsi', market: '港股', indexName: '恒生指数', value: '25,418.30', changePercent: -0.31, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
  { id: 'sp500', market: '美股', indexName: '标普500', value: '6,482.10', changePercent: 0.84, status: '已收盘', timestamp: dataTimestamp, source: '演示数据', delayed: true, mode: '演示' },
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
];

export const knowledge: KnowledgeCardData[] = [
  { id: 'cpi', term: 'CPI', definition: '居民购买一篮子常见商品和服务时，价格整体变化了多少。', example: '同样一篮子菜去年100元、今年102元，价格大约上涨2%。', misconception: 'CPI 下降不一定代表所有东西都降价，也可能只是上涨得更慢。' },
  { id: 'interest-rate', term: '利率', definition: '借钱要支付的价格，也是资金的时间成本。', example: '房贷利率下降时，每月利息负担通常会减少。', misconception: '降息并不保证股票上涨，经济走弱也可能同时压低企业利润。' },
  { id: 'valuation', term: '估值', definition: '市场愿意为公司未来赚钱能力支付多少价格。', example: '两家公司都赚1元，股价分别为10元和30元，市场给它们的估值不同。', misconception: '低估值不等于一定便宜，可能反映业务风险较高。' },
  { id: 'guidance', term: '业绩指引', definition: '公司管理层对未来一段时间收入或利润的预期。', example: '公司说下季度收入可能在100亿元上下，这就是指引。', misconception: '指引是预测，不是已经发生的事实。' },
];

export const brief: Brief = {
  date: '2026-09-08', generatedAt: dataTimestamp, headline: 'AI 投资、物价数据与利率预期是今天的三条主线',
  newsIds: ['nvidia-results', 'china-cpi', 'hongkong-rates'],
  watchItems: ['观察科技公司资本开支是否持续。', '关注物价变化能否转化为消费和盈利改善。', '区分“利率下降利好估值”与“经济走弱伤害盈利”。'],
  knowledgeId: 'interest-rate', mode: '演示',
};
