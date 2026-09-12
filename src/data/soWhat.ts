import type { ImpactDimension, NewsItem, PersonalImpact, SoWhatData } from './types';

const profiles: Record<string, Pick<SoWhatData, 'analogy' | 'surface' | 'focus' | 'marketBet' | 'expectationGap' | 'counterView'>> = {
  'nvidia-results': {
    analogy: { image: '像一家热门餐厅交出成绩单。', explanation: '客人变多只是第一层；市场还会看订位是否继续排满、每桌能留下多少利润，以及大家此前是不是早已按“满座”给它定价。' },
    surface: '芯片公司收入增长，AI 投资热度仍在。',
    focus: ['实际收入是否超过市场原本预期', '未来业绩指引是否继续上调', '毛利率能否在扩产与竞争中维持', '云厂商资本开支能否真正落地'],
    marketBet: ['云厂商继续增加 AI 资本开支', '芯片订单保持增长', '收入增长能转化为利润', '增长幅度继续超过已计入股价的预期'],
    expectationGap: '市场交易的不是“收入增长”这句话，而是新闻与原先预期之间的差异。增长若低于此前的高预期，业绩很好，股价也可能下跌。',
    counterView: '好公司不等于任何价格都是好股票。若估值已经包含多年高速增长，一次仅仅“符合预期”的成绩单也可能触发重新定价。',
  },
};

type ImpactRule = {
  label: ImpactDimension;
  score: (signals: Signals) => number;
  impact: string;
  why: string;
};

type Signals = {
  topic: string;
  terms: Set<string>;
  causal: string;
  context: string;
};

const has = (text: string, pattern: RegExp) => pattern.test(text);
const points = (condition: boolean, value: number) => condition ? value : 0;

const impactRules: ImpactRule[] = [
  {
    label: '投资',
    score: (s) => points(has(s.topic, /市场|公司/), 2) + points(s.terms.has('valuation'), 3) + points(has(s.causal, /股票|估值|资产|收益率|风险偏好|重新定价/), 4),
    impact: '相关股票、债券或其他资产的价格与波动可能变化。',
    why: '事件会改变市场对未来盈利、利率或风险补偿的估计，投资者因此重新定价。',
  },
  {
    label: '汇率',
    score: (s) => points(has(s.topic, /外汇|汇率/), 5) + points(has(s.causal, /汇率|货币|美元|人民币|欧元|兑换|资本流动/), 5) + points(has(s.context, /汇率|美元|人民币|欧元/), 2),
    impact: '换汇成本、外币资产价值以及跨境消费成本可能变化。',
    why: '利率差、贸易收支或跨境资金流改变时，两种货币之间的相对需求会重新平衡。',
  },
  {
    label: '住房',
    score: (s) => points(s.terms.has('interest-rate'), 1) + points(has(s.causal, /房贷|按揭|房地产|购房|住房融资/), 5),
    impact: '房贷负担、购房需求或房地产企业融资可能受到影响。',
    why: '只有当事件能沿着利率或信贷渠道传到房贷和房地产融资时，住房影响才成立。',
  },
  {
    label: '工作',
    score: (s) => points(has(s.topic, /公司|宏观|经济/), 1) + points(has(`${s.causal} ${s.context}`, /就业|失业|招聘|岗位|扩张|资本开支|订单|制造业/), 4),
    impact: '相关行业的招聘、岗位稳定性或薪资增长空间可能变化。',
    why: '订单、投资和企业扩张意愿会影响企业需要多少员工，以及是否愿意继续招聘。',
  },
  {
    label: '消费',
    score: (s) => points(s.terms.has('cpi'), 2) + points(has(s.causal, /生活成本|消费|居民|商品价格|物价|需求|能源价格/), 3),
    impact: '日常商品、服务或能源支出，以及家庭的实际购买力可能变化。',
    why: '成本和价格变化会影响同样收入可以买到多少东西，也会改变家庭是否愿意消费。',
  },
  {
    label: '企业经营',
    score: (s) => points(has(s.topic, /公司/), 3) + points(has(s.topic, /宏观|经济/), 1) + points(has(`${s.causal} ${s.context}`, /企业|成本|订单|收入|利润|融资|投资|资本开支|供应链|制造业/), 3),
    impact: '相关企业的订单、融资成本、收入或利润率可能发生变化。',
    why: '新闻通过需求、成本、融资或供应链传导，最终影响企业每卖出一笔业务能留下多少利润。',
  },
];

export function selectPersonalImpacts(item: NewsItem): PersonalImpact[] {
  const causal = item.causalChain.map((step) => `${step.title} ${step.explanation} ${step.condition}`).join(' ');
  const context = [item.title, item.summary, ...item.facts, ...item.consensus, ...item.inference].join(' ');
  const signals: Signals = { topic: item.topic, terms: new Set(item.termIds), causal, context };
  const condition = item.risks.join(' ') || '如果关键传导条件没有持续得到数据验证，这一影响就可能不成立。';

  return impactRules
    .map((rule, order) => ({ rule, order, score: rule.score(signals) }))
    .filter(({ score }) => score >= 4)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 5)
    .map(({ rule }) => ({ label: rule.label, impact: rule.impact, why: rule.why, condition }));
}

function genericProfile(item: NewsItem): SoWhatData {
  const isRate = item.termIds.includes('interest-rate');
  const isCpi = item.termIds.includes('cpi');
  const analogy = isRate
    ? { image: '像整个市场的“资金租金”发生了变化。', explanation: '利率影响借钱成本，也影响投资者拿低风险收益和股票未来回报作比较，因此会同时传到融资、盈利和估值。' }
    : isCpi
      ? { image: '像给生活成本和需求强弱量了一次体温。', explanation: '一个读数不能诊断全部经济状况，但连续变化会影响企业定价、居民消费与央行政策判断。' }
      : { image: '像企业和市场同时收到一张新的成绩单。', explanation: '数字本身只是结果，市场还会追问结果来自真实需求、成本变化还是短期因素，以及此前预期了多少。' };
  return {
    analogy,
    next: item.causalChain.map((step) => step.title),
    condition: item.causalChain.map((step) => step.condition),
    why: { cause: item.causalChain[0]?.title ?? item.title, mechanisms: item.causalChain.slice(1, -1).map((step) => step.title), result: item.causalChain.at(-1)?.title ?? item.summary },
    surface: item.title,
    focus: [...item.consensus, ...item.inference],
    marketBet: item.causalChain.map((step) => step.explanation),
    expectationGap: '市场会把新信息与原先预期比较。即使方向看起来有利，只要改善幅度低于预期，资产价格也可能走弱；反过来也一样。',
    counterView: item.risks.join(' '),
    personalImpact: selectPersonalImpacts(item),
  };
}

export function soWhatForNews(item: NewsItem): SoWhatData {
  const base = genericProfile(item);
  return { ...base, ...profiles[item.id] };
}
