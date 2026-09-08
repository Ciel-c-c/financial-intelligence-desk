import { useState } from 'react';
import type { KnowledgeCardData } from '../data/types';

export function TermExplanation({ item }: { item: KnowledgeCardData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="term-pill">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{item.term} <span>{open ? '−' : '+'}</span></button>
      {open && <p>{item.definition}</p>}
    </div>
  );
}
