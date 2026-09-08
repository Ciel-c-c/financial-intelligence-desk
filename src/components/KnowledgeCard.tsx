import { useState } from 'react';
import type { KnowledgeCardData } from '../data/types';

export function KnowledgeCard({ item, learned, onLearned }: { item: KnowledgeCardData; learned: boolean; onLearned: (checked: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="knowledge-card">
      <button className="knowledge-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span><small>知识卡</small><strong>{item.term}</strong></span><span>{open ? '收起' : '展开'}</span>
      </button>
      {open && <div className="knowledge-body"><p>{item.definition}</p><p><strong>举个例子：</strong>{item.example}</p><p><strong>常见误区：</strong>{item.misconception}</p></div>}
      <label className="learned-check"><input type="checkbox" aria-label={`标记 ${item.term} 已学会`} checked={learned} onChange={(event) => onLearned(event.target.checked)} />{learned ? '已学会' : '标记为已学会'}</label>
    </article>
  );
}
