import { useState } from 'react';
import type { KnowledgeCardData } from '../data/types';

export function TermExplanation({ item }: { item: KnowledgeCardData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="term-pill">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{item.term} <span>{open ? '−' : '+'}</span></button>
      {open && <div className="term-body">
        <section><h3>专业定义</h3><p>{item.definition}</p></section>
        <section><h3>大白话</h3><p>{item.plainLanguage}</p></section>
        <section><h3>为什么市场在意？</h3><ol className="term-chain">{item.marketChain.map((step, index) => <li key={step}><span>{step}</span>{index < item.marketChain.length - 1 && <b aria-hidden="true">→</b>}</li>)}</ol></section>
      </div>}
    </div>
  );
}
