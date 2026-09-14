export interface TransmissionChain { nodes: Array<{ title: string; detail?: string }>; condition: string; evidenceUrl?: string }

export function CoreTransmission({ chain }: { chain?: TransmissionChain }) {
  if (!chain || chain.nodes.length < 3 || chain.nodes.length > 6) return null;
  return <section className="impact-card dashboard-panel" aria-labelledby="impact-title"><p className="eyebrow">政治经济 → 资产价格</p><h2 id="impact-title">核心市场传导</h2><ol className="impact-chain" aria-label="宏观传导路径">{chain.nodes.map((node, index) => <li key={`${node.title}-${index}`}><div><span>{node.title}</span><b aria-hidden="true">{index < chain.nodes.length - 1 ? '↓' : '•'}</b></div>{node.detail && <p>{node.detail}</p>}</li>)}</ol><p>{chain.condition}</p>{chain.evidenceUrl && <a href={chain.evidenceUrl}>查看原始事件来源 →</a>}</section>;
}
