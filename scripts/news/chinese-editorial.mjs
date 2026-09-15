import {articleHash} from './full-article.mjs';
// Only explicitly supported, body-verified events are admitted. Unknown articles
// stay unpublished instead of receiving an unrelated stock-market template.
export function reviewChineseArticle(record){
 const body=record.article?.text;
 if(record.originalLanguage!=='zh'||!['cnfin-body','yicai-body'].includes(record.article?.reader)||typeof body!=='string'||articleHash(body)!==record.article.sha256) return record;
 if(record.article.reader==='yicai-body'&&['AI','英伟达'].every(term=>record.originalTitle.includes(term))&&['Anthropic','安全','资本支出','芯片'].every(term=>body.includes(term))) return reviewAiSpending(record);
 if(record.originalTitle.includes('粮农组织')&&['霍尔木兹海峡','化肥','施肥','粮食','采访'].every(term=>body.includes(term))) return reviewFoodSupply(record);
 if(!record.originalTitle.includes('在线酒店预订平台')||!['市场监管总局','文化和旅游部','行政指导','独家合作','全网最低价'].every(term=>body.includes(term))) return record;
 const summary='两部门对在线酒店预订平台开展行政指导，要求平台自查独家合作和“全网最低价”等竞争风险。重点是平台规则如何影响酒店经营与消费者选择，不是已经宣布酒店价格调整。';
 const facts=['市场监管总局与文化和旅游部召开在线酒店预订平台服务行业行政指导会。','报道明确要求平台落实合规责任，对独家合作和“全网最低价”等竞争风险开展自查。'];
 const consensus=['常见机制：平台约束会影响酒店能在哪些渠道销售、如何定价，以及平台获得订单和收入的方式；监管要求只有落实到规则和合同，才会改变这些经营条件。'];
 const inference=['条件性推演：如果平台减少排他限制，酒店可能增加销售渠道，消费者也可能获得更多比较选择；具体利润变化仍取决于佣金、订单量和获客成本。'];
 const risks=['行政指导不等于已作出处罚，也不等于已经出台统一降价措施。','如果平台规则并未实质改变，或酒店仍依赖单一平台获客，预期中的竞争改善可能有限。'];
 const causalChain=[
  {title:'监管要求自查',explanation:'先检查排他合作和价格条款等竞争风险。',condition:'平台按要求落实合规检查。'},
  {title:'平台规则可能调整',explanation:'规则改变才会传导到酒店销售渠道和定价空间。',condition:'自查推动合同或执行方式发生实质变化。'},
  {title:'经营与选择可能变化',explanation:'酒店渠道、获客成本与消费者可比较的选项可能改变。',condition:'订单和成本的变化没有抵消竞争改善。'}
 ];
 const watchItems=['平台是否公布规则或合同调整，而不是只作合规表态。','酒店的佣金、获客成本和跨平台经营是否发生变化。','消费者实际可比较的房价、服务与退订条件是否改善。'];
 const item={id:record.id,title:record.originalTitle,region:'A股',topic:'政策与平台经济',sourceName:record.sourceName,sourceUrl:record.canonicalUrl,publishedAt:record.publishedAt,summary,excerpt:'这次报道涉及既有法律下的平台合规要求。报道没有给出统一佣金调整、处罚金额或消费者价格下降幅度，不能将这些当成已发生事实。',termIds:[],facts,consensus,inference,risks,causalChain,mode:'今日快照'};
 const soWhat={
  analogy:{image:'像商场重新检查商户的入场合同。',explanation:'如果合同限制商户只能在这家商场销售，或要求所有渠道价格都不能更低，商户和顾客的选择就会受影响。平台规则也通过渠道与价格条款影响竞争；但线上平台还提供获客服务，不能忽略这部分成本。'},
  next:causalChain.map(step=>step.title),condition:causalChain.map(step=>step.condition),
  why:{cause:'平台合规要求',mechanisms:['销售渠道限制可能减少','定价与获客方式可能变化'],result:'酒店利润与消费者选择可能改变'},
  surface:item.title,focus:['要求如何落到合同和执行规则。','改变的是佣金、订单、成本还是仅仅表态。'],
  marketBet:['平台是否调整规则','酒店与平台如何分担获客成本','订单与利润是否超出原先预期'],
  expectationGap:'即使监管要求更严格，如果市场此前已预期更大调整，而实际规则变化较小，资产价格反应仍可能与标题直觉相反。需要比较实际变化与原先预期，不能直接判定利好或利空。',
  counterView:'渠道限制减少未必立即降低房价。平台提供流量和服务，酒店也承担运营成本；若获客成本上升，价格改善可能不明显。',
  personalImpact:[
   {label:'消费',impact:'订酒店时可比较的渠道、价格和服务条件可能变化。',why:'平台规则影响酒店能否跨平台经营及自主定价。',condition:'只有规则真正落实、酒店参与竞争，才可能改善选择；不代表房价一定下降。'},
   {label:'企业经营',impact:'酒店与平台的销售渠道、获客成本和利润分配可能调整。',why:'排他合作与价格条款决定订单从哪里来，以及经营者保留多少收入。',condition:'若佣金和合同不变，或新增渠道成本过高，利润未必改善。'}
  ]
 };
 const political={id:record.id,event:item.title,type:'监管',status:'关注',channel:consensus[0],affected:['酒店经营','在线旅游平台','消费者选择'],watch:watchItems.join(' '),counterRisk:risks.join(' '),newsId:record.id,publishedAt:record.publishedAt};
 return {...record,titleZh:item.title,summaryZh:summary,translationStatus:'original-zh',detailStatus:'so-what',facts,expectations:[],inferences:inference,editorial:{sourceBodyHash:record.article.sha256,originalTitle:record.originalTitle,reviewedAt:record.article.checkedAt,item,soWhat,political,watchItems}};
}

function reviewFoodSupply(record){
 const summary='新华财经引述粮农组织官员的采访：海峡航运受阻可能延迟化肥供应，错过施肥窗口，进而影响后续农业季的粮食产量。关键是运输中断持续多久，以及替代供应能否及时到位。';
 const facts=['新华财经报道引述粮农组织驻俄罗斯联邦联络处主管接受媒体采访时对粮食供给风险的判断。','报道指出，霍尔木兹海峡也是尿素等化肥的运输通道，化肥到货时间需要配合农作物施肥周期。'];
 const consensus=['常见机制：农业投入不仅要看价格，还要看是否及时到位。化肥运输延迟若跨过最佳施肥窗口，可能影响作物产量；供给收缩随后才可能推高粮食和食品成本。'];
 const inference=['条件性推演：如果航运问题持续且替代化肥不能及时补足，农业和食品企业的成本及供给压力可能加大；这不是对实际减产幅度或食品价格涨幅的确认。'];
 const risks=['粮食减产属于报道引述的预测，不是已经实现的全球产量数据；报道日期也不等于采访或冲突开始日期。','替代航线、化肥库存、其他产区增产及天气条件可能缓解影响。'];
 const causalChain=[
  {title:'海峡运输受阻',explanation:'化肥等农业投入品的交付可能受到影响。',condition:'受阻确实影响相关化肥运输，而非仅出现短暂波动。'},
  {title:'化肥可能延迟',explanation:'农户可能无法按原计划取得投入品。',condition:'库存和替代运输不能及时补足供应。'},
  {title:'错过施肥窗口',explanation:'农业生产依赖种植周期，延迟到货不一定能补回效果。',condition:'延迟跨过最佳施肥时间。'},
  {title:'粮食供给可能减少',explanation:'投入不足可能影响产量，供给变化再传到价格与企业成本。',condition:'其他产区增产和需求变化不足以抵消减产。'}
 ];
 const watchItems=['海峡实际通航和化肥交付是否恢复。','主要种植区的施肥窗口、化肥库存与替代进口来源。','实际作物产量、粮食库存和食品企业成本，而不是仅看新闻标题。'];
 const item={id:record.id,title:record.originalTitle,region:'全球',topic:'地缘与粮食供应',sourceName:record.sourceName,sourceUrl:record.canonicalUrl,publishedAt:record.publishedAt,summary,excerpt:'这条新闻通过农业投入品和种植周期传导，不应套用旧油价报道的关系链。需要把官员预测与随后公布的实际产量、库存和价格数据分开。',termIds:['cpi'],facts,consensus,inference,risks,causalChain,mode:'今日快照'};
 const soWhat={
  analogy:{image:'像装修材料错过了施工排期。',explanation:'材料晚几周到，并不只是多等几周：如果错过关键工序，整个工程都可能延迟。化肥也要配合种植周期，但农业受季节和天气约束更强，不一定能通过加班补回。'},
  next:causalChain.map(step=>step.title),condition:causalChain.map(step=>step.condition),
  why:{cause:'农业投入品运输受阻',mechanisms:['化肥无法及时到位','作物生长窗口可能错过'],result:'粮食产量与食品成本可能受影响'},
  surface:item.title,focus:['运输延迟是否跨过施肥窗口。','实际供给损失能否被库存和替代产区补足。'],
  marketBet:['运输能否及时恢复','化肥能否赶上种植周期','实际减产是否超过预期','企业是否能够转移成本'],
  expectationGap:'如果市场已预期严重供应短缺，但替代运输及时恢复，即使航运仍有压力，相关价格也可能回落。交易的是实际供给变化与原先预期的差异，不能机械推断粮价或股票必涨。',
  counterView:'化肥短缺风险不等于全球食品价格一定上涨。库存、天气、其他地区产量与需求都可能改变最终结果；食品企业还要看能否转移成本，而不是只看销售价格。',
  personalImpact:[
   {label:'消费',impact:'部分食品价格与可获得性可能受到影响。',why:'农业投入不到位可能减少粮食供给，随后增加食品加工和采购成本。',condition:'只有供给损失未被库存和其他产区抵消时才可能传到终端；并非所有食品同步涨价。'},
   {label:'企业经营',impact:'农业、食品加工与餐饮企业的采购成本和利润率可能承压。',why:'成本增加未必能够全部转嫁给消费者，每笔销售真正留下的利润可能减少。',condition:'库存、替代供应、长期采购合同和提价能力可能缓解压力。'}
  ]
 };
 const political={id:record.id,event:item.title,type:'地缘风险',status:'关注',channel:consensus[0],affected:['农业投入品','粮食供应','食品与餐饮成本'],watch:watchItems.join(' '),counterRisk:risks.join(' '),newsId:record.id,publishedAt:record.publishedAt};
 return {...record,regions:['全球'],eventTypes:['地缘风险'],impactChannels:['供需','通胀','盈利'],titleZh:item.title,summaryZh:summary,translationStatus:'original-zh',detailStatus:'so-what',facts,expectations:[],inferences:inference,editorial:{sourceBodyHash:record.article.sha256,originalTitle:record.originalTitle,reviewedAt:record.article.checkedAt,item,soWhat,political,watchItems}};
}

function reviewAiSpending(record){
 const nvda=record.article.text.match(/英伟达[\s\S]{0,30}?股价跌([\d.]+)%/)?.[1];
 if(!nvda) return record;
 const title='AI安全讨论引发需求担忧，多地半导体股下跌';
 const summary='第一财经报道多地芯片股下跌，英伟达跌'+nvda+'%。市场担心前沿AI开发放缓会影响基础设施投入。需要区分安全讨论、未来采购预期与已经确认的订单变化。';
 const facts=['第一财经报道的该交易日行情中，英伟达股价下跌'+nvda+'%。','报道梳理了AI行业人士关于模型发展节奏与安全能力的讨论，以及芯片需求和资本支出的担忧。'];
 const consensus=['常见机制：模型开发若放缓，数据中心扩张和芯片采购的增长预期可能降低，进而影响芯片公司的未来收入预期和估值；但安全讨论本身不能证明采购已经削减。'];
 const inference=['条件性推演：芯片制造商可能面临增长预期重估；云服务商如果减少投资，短期资本支出可能下降，但计算需求、收入与现金流如何变化需要分别验证。'];
 const risks=['报道中的安全讨论不等于公司已经减少订单，也不等于正式监管禁令。','实际AI应用需求、在手订单和未来业绩指引可能支持投资继续增长；同期利率、风险偏好与持仓变化也可能影响股价，不能归因于单一新闻。'];
 const causalChain=[
  {title:'AI安全讨论升温',explanation:'市场重新评估模型开发和部署的速度。',condition:'讨论影响企业真实部署计划，而不只是公开表态。'},
  {title:'投入预期可能放缓',explanation:'部署节奏可能改变数据中心与算力采购计划。',condition:'企业因此调整资本支出，而应用需求未完全补足。'},
  {title:'芯片收入预期重估',explanation:'采购变化才会传到供应商的订单和未来收入。',condition:'实际采购路径低于市场原先预期。'},
  {title:'估值可能调整',explanation:'未来增长预期变化会改变投资者愿意支付的价格。',condition:'市场尚未充分计入这一变化，其他利好不能抵消。'}
 ];
 const watchItems=['AI企业是否真的下调资本支出和部署计划。','芯片厂商的在手订单、收入指引与利润率是否改变。','安全工具需求能否形成新增收入，以及利率变化如何影响估值。'];
 const item={id:record.id,title,region:'全球',topic:'AI与产业投资',sourceName:record.sourceName,sourceUrl:record.canonicalUrl,publishedAt:record.publishedAt,summary,excerpt:'同一条消息可能对芯片供应商、云服务商和安全工具企业产生不同影响。既要看收入，也要看资本支出、利润率和现金流；单日股价变化并不确认长期需求趋势。',termIds:['valuation'],facts,consensus,inference,risks,causalChain,mode:'今日快照'};
 const soWhat={
  analogy:{image:'像连锁企业重新评估开新店的速度。',explanation:'开店节奏放慢，设备供应商可能少卖设备，而连锁企业可能少花建设资金。但已有门店的需求并不自动消失。AI公司的算力投入和供应商订单也有这种关系，还要继续核对实际计划。'},
  next:causalChain.map(step=>step.title),condition:causalChain.map(step=>step.condition),
  why:{cause:'部署速度预期变化',mechanisms:['算力采购计划可能调整','供应商增长预期可能改变'],result:'收入、现金流与估值可能重估'},
  surface:title,focus:['企业有没有真正改变投入和采购。','未来增长是否低于股价此前计入的预期。'],marketBet:['部署计划是否调整','资本支出是否下修','订单和收入是否低于预期','新安全需求能否形成收入'],
  expectationGap:'如果股价原本计入持续加速的采购，即使收入仍增长，只要增长没有原来预期那么快，股价也可能下跌。反之，如果担忧已经充分计价，订单好于担忧又可能支持反弹。',
  counterView:'开发节奏放缓不等于算力需求消失。应用推广和安全工具也需要算力；减少资本支出还可能改善部分企业短期现金流。需要逐家公司看订单、成本和利润，而不是给所有AI资产同一个结论。',
  personalImpact:[
   {label:'投资',impact:'AI与半导体相关股票和基金可能出现增长预期重估。',why:'未来订单和收入决定盈利预期，预期变化又会影响估值。',condition:'要核对持仓业务和已计入的预期；股价下跌不等于每家公司的基本面都恶化。'},
   {label:'企业经营',impact:'算力供应商和AI使用企业的采购、收入与现金流可能变化。',why:'一方的资本支出往往是另一方的订单，但使用方也可能节省建设成本。',condition:'只有企业实际调整计划才会传导，应用需求增长可能抵消放缓。'},
   {label:'工作',impact:'相关企业的扩张和招聘节奏可能受到影响。',why:'订单和投资计划会影响企业是否新增团队与岗位。',condition:'新闻本身没有确认裁员；安全、应用和其他业务的招聘可能仍增长。'}
  ]
 };
 const political={id:record.id,event:title,type:'技术与产业风险',status:'关注',channel:consensus[0],affected:['芯片与算力供应商','云服务企业','AI安全工具'],watch:watchItems.join(' '),counterRisk:risks.join(' '),newsId:record.id,publishedAt:record.publishedAt};
 return {...record,regions:['全球','美股相关'],eventTypes:['公司经营'],impactChannels:['供需','盈利','估值'],titleZh:title,summaryZh:summary,translationStatus:'original-zh',detailStatus:'so-what',facts,expectations:[],inferences:inference,editorial:{sourceBodyHash:record.article.sha256,originalTitle:record.originalTitle,reviewedAt:record.article.checkedAt,item,soWhat,political,watchItems}};
}
