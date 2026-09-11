import type { GlobalSituationSnapshot } from './globalSituationTypes';

const energyEvent = {
  id: 'middle-east-energy-risk',
  headline: '中东冲突继续影响能源运输与全球通胀判断',
  oneLine: '市场担心的核心是石油能不能稳定运出来，以及高油价会不会让降息更难。',
  summary: '公开报道显示原油价格与债券收益率上升，市场继续评估能源供应、运输安全和通胀的连锁影响。',
  publishedAt: '2026-09-11T05:30:00+08:00', fetchedAt: '2026-09-11T10:00:00+08:00',
  region: 'middle-east', topic: '能源安全', eventType: 'energy-security',
  relevance: { level: 'high' as const, score: 8, criteria: ['energySupply','tradeSupplyChain','inflation','growth','centralBank','earnings','riskAppetite','marketReaction'] },
  fact: ['美股三大指数在 9 月 10 日连续第四个交易日下跌。','相关公开报道所列 WTI 与布伦特原油均升至每桶 100 美元上方。'],
  marketView: ['市场重点关注能源运输或供应是否受阻，因为油价会进入运输、制造与生活成本。','主流机制解释是：持续高油价可能抬高通胀预期，并让央行对降息更谨慎。'],
  scenarios: ['如果供应风险持续且油价居高不下，航空、运输和部分消费行业利润可能承压；能源生产商可能受益，但仍取决于产量和成本。'],
  simpleExample: '想象全球每天需要 100 桶石油。原来大家相信 100 桶都能运到，突然开始担心以后只能到 90 桶。即使今天还没真的少 10 桶，买家也可能提前抢油，油价便会先涨。',
  professionalConcept: '市场正在为潜在供应中断加入更高的能源风险溢价。',
  causalChain: [
    { id:'supply', title:'能源运输风险上升', beginnerExplanation:'买家担心未来拿不到足够的油，会更早锁定货源。', condition:'紧张局势持续且替代路线有限', uncertain:false },
    { id:'oil', title:'原油价格可能上涨', beginnerExplanation:'担心短缺时，愿意付更高价格的买家会增加。', condition:'库存和备用产能不足以抵消', uncertain:true },
    { id:'cost', title:'企业成本可能增加', beginnerExplanation:'飞机、卡车、工厂和化工原料都离不开能源。', condition:'企业无法完全锁价或提高效率', uncertain:true },
    { id:'inflation', title:'通胀压力可能升高', beginnerExplanation:'企业可能把一部分更高成本加到商品和服务价格里。', condition:'消费者仍能承受提价', uncertain:true },
    { id:'rates', title:'降息空间可能缩小', beginnerExplanation:'央行会担心物价压力扩散得更久。', condition:'高油价持续且增长没有明显崩弱', uncertain:true },
  ],
  relatedAssets: [
    { name:'原油', symbol:'🛢', explanation:'供应中断概率会直接进入每桶油的价格。' },
    { name:'黄金', symbol:'◈', explanation:'风险上升时资金可能寻找避险，但更高实际利率也可能压制黄金。' },
    { name:'10Y 美债收益率', symbol:'⌁', explanation:'油价推高通胀预期时，长期债券持有人可能要求更高收益。' },
    { name:'航空股', symbol:'✈', explanation:'燃油是重要成本；机票不能同步涨价时，利润可能下降。' },
    { name:'能源股', symbol:'⚡', explanation:'油价上涨可能提高收入，但最终利润还看产量、税费和开采成本。' },
  ],
  relatedIndustries:['能源','航空','航运','化工'], knowledgeIds:['geopolitics','supply-demand','cpi','interest-rate','bonds'],
  conditionsThatChangeView:['停火或紧张局势明显缓和','关键航线恢复正常运输','OPEC 或其他产油国增产','释放战略石油储备','全球需求明显下降','实际供应没有受到影响'],
  marketReaction:[
    { asset:'S&P 500', change:'-0.58%', window:'9 月 10 日收盘', asOf:'2026-09-11T05:30:00+08:00', sourceName:'Associated Press', sourceUrl:'https://apnews.com/article/7fbc77061abd778608068d3beb1bbbaf' },
    { asset:'Nasdaq', change:'-0.65%', window:'9 月 10 日收盘', asOf:'2026-09-11T05:30:00+08:00', sourceName:'Associated Press', sourceUrl:'https://apnews.com/article/7fbc77061abd778608068d3beb1bbbaf' },
  ],
  sources:[{ name:'Associated Press', url:'https://apnews.com/article/7fbc77061abd778608068d3beb1bbbaf', publishedAt:'2026-09-11T05:30:00+08:00' }],
};

const ecbEvent = {
  id:'ecb-energy-rate-decision', headline:'欧洲央行提高政策利率，应对能源推动的通胀压力',
  oneLine:'欧洲央行选择让借钱更贵，希望阻止能源涨价继续扩散到其他商品和服务。',
  summary:'欧洲央行宣布提高政策利率 0.25 个百分点，市场关注通胀控制与经济增长之间的取舍。',
  publishedAt:'2026-09-10T20:20:00+08:00', fetchedAt:'2026-09-11T10:00:00+08:00', region:'europe', topic:'央行政策', eventType:'monetary-policy',
  relevance:{ level:'high' as const, score:7, criteria:['inflation','growth','centralBank','earnings','capitalFlows','riskAppetite','marketReaction'] },
  fact:['欧洲央行在 9 月 10 日宣布将政策利率提高 0.25 个百分点。'],
  marketView:['能源涨价若扩散到工资、运输和服务，通胀可能持续更久，因此央行选择压低需求。','更高利率会提高家庭与企业融资成本，也会提高股票估值使用的贴现率。'],
  scenarios:['如果通胀继续高于目标且经济仍有韧性，市场可能推迟对未来降息的预期。'],
  simpleExample:'把利率想成“借钱的租金”。租金提高后，家庭会少借一点，企业也会推迟一些回报不够高的项目，经济中的花钱速度可能慢下来。',
  professionalConcept:'专业一点说，央行通过收紧金融条件抑制总需求和通胀扩散。',
  causalChain:[
    { id:'energy',title:'能源价格上涨',beginnerExplanation:'交通、生产和生活需要支付更多能源费用。',condition:'高油价持续',uncertain:false },
    { id:'spread',title:'通胀可能扩散',beginnerExplanation:'企业可能把成本加到更多商品和服务价格中。',condition:'企业有定价能力',uncertain:true },
    { id:'hike',title:'央行提高利率',beginnerExplanation:'借钱更贵后，消费和投资需求可能放慢。',condition:'货币政策能传到贷款市场',uncertain:true },
    { id:'valuation',title:'估值与盈利承压',beginnerExplanation:'融资变贵，未来利润折算到今天也会更少。',condition:'盈利增长不能抵消利率影响',uncertain:true },
  ],
  relatedAssets:[{name:'欧元',symbol:'€',explanation:'相对利率和增长预期会改变持有欧元的吸引力。'},{name:'欧洲国债',symbol:'⌁',explanation:'政策路径会直接进入债券收益率。'},{name:'银行股',symbol:'▦',explanation:'息差可能改善，但贷款需求和坏账也可能恶化。'},{name:'房地产',symbol:'⌂',explanation:'按揭与开发融资更贵，会影响需求和项目回报。'}],
  relatedIndustries:['银行','房地产','公用事业','可选消费'],knowledgeIds:['interest-rate','cpi','bonds','valuation'],
  conditionsThatChangeView:['能源价格快速回落','增长与就业明显恶化','银行信用快速收紧','通胀预期重新稳定'],marketReaction:[],
  sources:[{name:'Associated Press',url:'https://apnews.com/article/de62b59fba535fccaf6f75e52d037c63',publishedAt:'2026-09-10T20:20:00+08:00'}],
};

const tradeEvent = {
  id:'china-export-trade-policy',headline:'中国出口增长，市场同时评估外需与贸易政策变化',
  oneLine:'海外订单在增加，但企业能不能真正多赚钱，还要看关税、汇率和提前出货。',
  summary:'公开报道援引中国公布的数据称，8 月出口同比增长，汽车和高科技产品是重要推动因素。',
  publishedAt:'2026-09-08T18:00:00+08:00',fetchedAt:'2026-09-11T10:00:00+08:00',region:'china',topic:'贸易与供应链',eventType:'trade-policy',
  relevance:{level:'medium' as const,score:5,criteria:['tradeSupplyChain','growth','earnings','capitalFlows','riskAppetite']},
  fact:['相关报道所列中国 8 月出口同比增长 25%。'],marketView:['出口增加通常会支持制造业订单、就业与企业收入。','市场会进一步检查增长是否来自真实终端需求，还是关税生效前的提前出货。'],
  scenarios:['如果订单持续且企业能够控制原料与汇率成本，汽车、电子和物流供应链的盈利可能改善。'],
  simpleExample:'一家工厂原来每月接 100 张订单，现在接到 125 张。听起来很好，但如果客户只是把下个月的订单提前了，或者每张订单利润更薄，就不能把 25% 直接当成长期增长。',
  professionalConcept:'专业一点说，需要区分真实外需、基数效应、抢出口和贸易条件变化。',
  causalChain:[{id:'orders',title:'海外订单增加',beginnerExplanation:'外国买家购买更多产品。',condition:'不是短期提前出货',uncertain:false},{id:'production',title:'制造业生产可能增加',beginnerExplanation:'工厂需要更多原料、工人和运输。',condition:'企业有足够产能',uncertain:true},{id:'profit',title:'利润可能改善',beginnerExplanation:'收入增长只有扣除原料、汇率和关税成本后才变成利润。',condition:'成本没有涨得更快',uncertain:true}],
  relatedAssets:[{name:'人民币',symbol:'¥',explanation:'贸易收款与跨境资金流会改变货币供求。'},{name:'汽车股',symbol:'◇',explanation:'海外销量增长可能支持收入，但关税和本地竞争决定利润。'},{name:'港口航运',symbol:'▱',explanation:'出口量与提前出货会影响货运需求。'},{name:'电子制造',symbol:'▧',explanation:'海外科技需求会传到零部件和代工订单。'}],relatedIndustries:['汽车','电子制造','港口物流'],knowledgeIds:['trade','exchange-rate','industry-cycle','statements'],
  conditionsThatChangeView:['新增关税或出口限制','增长主要来自提前出货','海外需求转弱','人民币与原材料成本大幅变化','企业收入增加但现金流没有改善'],marketReaction:[],
  sources:[{name:'Associated Press',url:'https://apnews.com/article/d3d6157a534584985987f828a940cffa',publishedAt:'2026-09-08T18:00:00+08:00'}],
};

const fedEvent = {
  id:'fed-inflation-expectations',headline:'美国通胀预期缓和，就业担忧上升',oneLine:'家庭对涨价没那么担心了，却更担心工作，这让央行的利率选择变得更复杂。',
  summary:'纽约联储发布消费者预期调查，中期通胀预期下降，同时失业预期恶化。',publishedAt:'2026-09-08T22:00:00+08:00',fetchedAt:'2026-09-11T10:00:00+08:00',region:'united-states',topic:'增长与利率',eventType:'monetary-policy',
  relevance:{level:'medium' as const,score:5,criteria:['inflation','growth','centralBank','capitalFlows','riskAppetite']},fact:['纽约联储发布了最新消费者预期调查。'],marketView:['通胀预期下降有助于稳定工资和定价行为，就业担忧则可能让家庭减少非必要消费。'],scenarios:['如果后续官方就业数据也走弱，同时实际通胀继续下降，市场可能增加对降息的预期。'],
  simpleExample:'一家人原来怕物价继续猛涨，所以提前买东西；现在不再急着抢购，却担心收入，可能反而把钱留在账户里。消费会因此变慢。',professionalConcept:'专业一点说，央行面临通胀预期与增长预期同时变化的双重信号。',
  causalChain:[{id:'expectation',title:'通胀预期下降',beginnerExplanation:'家庭觉得未来涨价速度可能慢一点。',condition:'实际价格没有重新加速',uncertain:false},{id:'jobs',title:'就业担忧上升',beginnerExplanation:'担心收入时，家庭可能减少非必要消费。',condition:'担忧转成真实招聘放缓',uncertain:true},{id:'fed',title:'利率判断更复杂',beginnerExplanation:'央行既要管物价，也要防经济过度变弱。',condition:'官方数据印证调查',uncertain:true}],
  relatedAssets:[{name:'美国国债',symbol:'⌁',explanation:'增长与通胀预期会改变投资者要求的收益率。'},{name:'美元',symbol:'$',explanation:'相对利率和避险需求会改变美元需求。'},{name:'消费股',symbol:'▤',explanation:'就业担忧可能让家庭减少可选消费。'}],relatedIndustries:['银行','可选消费','房地产'],knowledgeIds:['cpi','interest-rate','expectations','probability'],conditionsThatChangeView:['实际 CPI 重新加速','就业数据保持强劲','调查没有转化成真实消费变化','央行更重视金融风险'],marketReaction:[],sources:[{name:'纽约联邦储备银行',url:'https://www.newyorkfed.org/press',publishedAt:'2026-09-08T22:00:00+08:00'}],
};

export const globalSituationSeed: GlobalSituationSnapshot = {
  schemaVersion:1, attemptedAt:'2026-09-11T10:00:00+08:00', lastSuccessfulAt:'2026-09-11T10:00:00+08:00', status:'fresh',
  sourceHealth:[{id:'seed',name:'已发布新闻与官方快照',status:'ok',itemCount:4}],
  events:[energyEvent,ecbEvent,tradeEvent,fedEvent],
};
