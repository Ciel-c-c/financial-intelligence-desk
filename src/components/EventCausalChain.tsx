import { useState } from 'react';
import type { CausalNode } from '../data/globalSituationTypes';

export function EventCausalChain({ nodes }: { nodes: CausalNode[] }) {
  const [selected,setSelected] = useState(nodes[0]?.id ?? '');
  const current = nodes.find(node => node.id === selected) ?? nodes[0];
  return <div className="event-chain-wrap">
    <ol className="event-chain" aria-label="事件影响链">
      {nodes.map((node,index) => <li key={node.id}>
        {index > 0 && <span className="chain-connector" aria-hidden="true">{node.uncertain ? '可能 →' : '→'}</span>}
        <button type="button" aria-pressed={selected === node.id} onClick={() => setSelected(node.id)}>
          <small>{String(index + 1).padStart(2,'0')}</small><strong>{node.title}</strong><span>点开看解释</span>
        </button>
      </li>)}
    </ol>
    {current && <div className="chain-explanation" role="status"><b>{current.title}</b><p>{current.beginnerExplanation}</p><small>这一步成立的条件：{current.condition}</small></div>}
  </div>;
}
