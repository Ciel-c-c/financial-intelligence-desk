import { Link, useParams } from 'react-router-dom';
import { AnalysisBlock } from '../components/AnalysisBlock';
import { CausalChain } from '../components/CausalChain';
import { TermExplanation } from '../components/TermExplanation';
import { knowledge } from '../data/demoData';
import { getNewsById } from '../data/selectors';

export function NewsDetailPage() {
  const { id = '' } = useParams();
  const item = getNewsById(id);
  if (!item) return <main className="page detail-page"><Link to="/">← 返回今日</Link><h1>没有找到这条资讯</h1><p>它可能已移动，返回首页查看现有演示内容。</p></main>;
  const terms = knowledge.filter((term) => item.termIds.includes(term.id));
  return (
    <main className="page detail-page">
      <Link className="back-link" to="/">← 返回今日</Link>
      <article className="article-head">
        <div className="card-row"><span className="topic">{item.region} · {item.topic}</span><span className="demo-badge">{item.mode}</span></div>
        <h1>{item.title}</h1><p className="lead">{item.summary}</p>
        <div className="source-row"><span>{item.sourceName} · {item.publishedAt}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a></div>
      </article>
      <section className="reading-card"><p className="eyebrow">演示阅读段落</p><p>{item.excerpt}</p><div className="terms">{terms.map((term) => <TermExplanation key={term.id} item={term} />)}</div></section>
      <section><p className="eyebrow">发生后可能怎样传导</p><h2 className="display-heading">事件因果链</h2><CausalChain steps={item.causalChain} /><p className="uncertainty">这些路径是有条件的可能性，不代表市场一定按此方向变化。</p></section>
      <div className="analysis-grid">
        <AnalysisBlock title="事实" tone="fact" items={item.facts} />
        <AnalysisBlock title="市场共识" tone="consensus" items={item.consensus} />
        <AnalysisBlock title="AI 推演" tone="inference" items={item.inference} />
        <AnalysisBlock title="风险与反例" tone="risk" items={item.risks} />
      </div>
    </main>
  );
}
