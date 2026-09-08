import { useMemo, useState } from 'react';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { knowledge } from '../data/demoData';

const storageKey = 'fid-learned-terms';
function loadLearned(): string[] { try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[]; } catch { return []; } }

export function LearnPage() {
  const [query, setQuery] = useState('');
  const [learned, setLearned] = useState<string[]>(loadLearned);
  const filtered = useMemo(() => knowledge.filter((item) => `${item.term} ${item.definition}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query]);
  function update(id: string, checked: boolean) { const next = checked ? [...new Set([...learned, id])] : learned.filter((item) => item !== id); setLearned(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Reading remains available. */ } }
  return (
    <main className="page inner-page">
      <header className="page-title"><p className="eyebrow">小白金融课</p><h1>遇到什么，学什么</h1><p>从当天资讯出发，用生活中的例子理解金融词汇。</p></header>
      <label className="search-field"><span>搜索知识</span><input type="search" aria-label="搜索知识" placeholder="例如：CPI、利率、估值" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="knowledge-list">{filtered.map((item) => <KnowledgeCard key={item.id} item={item} learned={learned.includes(item.id)} onLearned={(checked) => update(item.id, checked)} />)}{filtered.length === 0 && <p className="empty-state">暂时没有这张知识卡。</p>}</div>
    </main>
  );
}
