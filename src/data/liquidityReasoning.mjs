// Narrow safety filter for an observed gross-operation -> net-funds leap.
// It is not a general economic proof and does not classify all repo operations.
export function liquidityReasoningIssue(chain,source){
 if(!Array.isArray(chain)||typeof source!=='string')return undefined;
 const withdrawals=source.split(/\n|(?<=[。；])/u).filter(s=>/逆回购/.test(s)&&/净回笼/.test(s));
 for(let i=1;i<chain.length;i++){
  const previous=[chain[i-1]?.title,chain[i-1]?.explanation].join(' ');
  const current=[chain[i]?.title,chain[i]?.explanation,chain[i]?.condition].join(' ');
  if(!/逆回购/.test(previous)||!/银行(?:体系)?.{0,12}(?:可用资金|流动性).{0,8}(?:增多|增加|上升)/.test(current))continue;
  if(/(?:若|如果|只有|在).{0,30}(?:扣除到期|计入到期|净投放|净注入)/.test(current))continue;
  const linked=withdrawals.some(s=>[...s.matchAll(/(\d+(?:[.,]\d+)*)亿元/g)].some(m=>previous.includes(m[0])));
  if(linked)return 'gross-repo-is-not-net-injection';
 }
}
export function editorialLiquidityIssue(record){
 const evidence=record.editorial?.evidence;
 const quotes=evidence?Object.values(evidence).flat().map(e=>e?.evidence).filter(v=>typeof v==='string'):[];
 return liquidityReasoningIssue(record.editorial?.item?.causalChain,[record.article?.text??'',...quotes].join('\n'));
}
