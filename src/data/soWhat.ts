import type { NewsItem, SoWhatData } from './types';

const profiles: Record<string, Pick<SoWhatData, 'analogy' | 'surface' | 'focus' | 'marketBet' | 'expectationGap' | 'counterView' | 'personalImpact'>> = {
  'nvidia-results': {
    analogy: { image: '像一家热门餐厅交出成绩单。', explanation: '客人变多只是第一层；市场还会看订位是否继续排满、每桌能留下多少利润，以及大家此前是不是早已按“满座”给它定价。' },
    surface: '芯片公司收入增长，AI 投资热度仍在。',
    focus: ['实际收入是否超过市场原本预期', '未来业绩指引是否继续上调', '毛利率能否在扩产与竞争中维持', '云厂商资本开支能否真正落地'],
    marketBet: ['云厂商继续增加 AI 资本开支', '芯片订单保持增长', '收入增长能转化为利润', '增长幅度继续超过已计入股价的预期'],
    expectationGap: '市场交易的不是“收入增长”这句话，而是新闻与原先预期之间的差异。增长若低于此前的高预期，业绩很好，股价也可能下跌。',
    counterView: '好公司不等于任何价格都是好股票。若估值已经包含多年高速增长，一次仅仅“符合预期”的成绩单也可能触发重新定价。',
    personalImpact: [
      { label: '股票', impact: 'AI 芯片及上下游公司的估值可能波动。', why: '投资者会同时重估订单、利润率与未来增长。', condition: '需求要能落到真实订单，且结果需要超过已计入的预期。' },
      { label: '工作 / 就业', impact: '云计算、数据中心和半导体岗位需求可能获得支持。', why: '资本开支扩大通常需要更多研发、建设与运维。', condition: '企业预算持续执行，而不是一次性采购。' },
    ],
  },
};

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
    personalImpact: [{ label: item.region === '全球' ? '全球资产' : '股票', impact: item.inference.join(' '), why: item.consensus.join(' '), condition: item.risks.join(' ') }],
  };
}

export function soWhatForNews(item: NewsItem): SoWhatData {
  const base = genericProfile(item);
  return { ...base, ...profiles[item.id] };
}
