import { useState } from 'react';
import type { SoWhatData } from '../data/types';

function Flow({ nodes, label }: { nodes: string[]; label: string }) {
  return <ol className="so-flow" aria-label={label}>{nodes.map((node, index) => <li key={`${node}-${index}`}><span>{node}</span>{index < nodes.length - 1 && <b aria-hidden="true">→</b>}</li>)}</ol>;
}

export function SoWhatSection({ data }: { data: SoWhatData }) {
  const [expanded, setExpanded] = useState(false);
  const whyNodes = [data.why.cause, ...data.why.mechanisms, data.why.result];
  return (
    <section className="so-what" aria-labelledby="so-what-title">
      <header className="so-what-head"><div><p className="eyebrow">先告诉你市场怎么看，再解释为什么</p><h2 id="so-what-title">所以呢？</h2></div><span>FINANCIAL LENS</span></header>
      <div className="so-card analogy-card"><h3>像什么？</h3><strong>{data.analogy.image}</strong><p>{data.analogy.explanation}</p></div>
      <div className="so-card"><h3>接下来可能</h3><Flow nodes={data.next} label="可能的传导链" /><div className="so-condition"><b>成立条件</b><ul>{data.condition.map((condition) => <li key={condition}>{condition}</li>)}</ul></div></div>
      <div className="so-card focus-card"><h3>表面新闻 vs 真正重点</h3><div className="focus-compare"><div><small>表面新闻</small><p>{data.surface}</p></div><div><small>真正重点</small><Flow nodes={data.focus} label="市场真正关注的重点" /></div></div><blockquote>别只看发生了什么，要看这件事改变了什么。</blockquote></div>
      {expanded && <div id="so-what-more" className="so-more">
        <div className="so-card"><h3>为什么？</h3><Flow nodes={whyNodes} label="原因到结果的机制" /></div>
        <div className="so-card expectation-card"><h3>市场在赌什么？</h3><p>已经发生的消息很快会进入价格。现在交易的是下一步：</p><Flow nodes={data.marketBet} label="市场预期链" /><p>{data.expectationGap}</p></div>
        <div className="so-card counter-card"><h3>换个方向看</h3><p>{data.counterView}</p></div>
        <div className="so-card"><h3>跟我有什么关系？</h3><div className="impact-list">{data.personalImpact.map((impact) => <article key={impact.label}><h4>{impact.label}</h4><p><b>可能影响：</b>{impact.impact}</p><p><b>为什么：</b>{impact.why}</p><p><b>要看条件：</b>{impact.condition}</p></article>)}</div></div>
      </div>}
      <button className="so-toggle" type="button" aria-expanded={expanded} aria-controls="so-what-more" onClick={() => setExpanded((value) => !value)}>{expanded ? '收起深入解读 ↑' : '继续看懂：预期、反例和与你的关系 ↓'}</button>
    </section>
  );
}
