import { Link } from 'react-router-dom';
import { AnalysisBlock } from './AnalysisBlock';
import { TermExplanation } from './TermExplanation';
import { SoWhatSection } from './SoWhatSection';
import { knowledge } from '../data/demoData';
import { knowledgeForEvent } from '../data/learningEvents';
import { soWhatForNews } from '../data/soWhat';
import type { NewsItem,SoWhatData } from '../data/types';
export function NewsArticle({item,data,language='zh'}:{item:NewsItem;data?:SoWhatData;language?:'zh'|'en'}) {
  const terms = knowledge.filter((term) => item.termIds.includes(term.id));
  return (
    <main className="page detail-page">
      <Link className="back-link" to="/">← 返回今日</Link>
      <article className="article-head">
        <div className="card-row"><span className="topic">{item.region} · {item.topic}</span><span className="demo-badge">{item.mode}</span></div>
        <h1>{item.title}</h1><p className="lead">{item.summary}</p>
        <div className="source-row"><span>{item.sourceName} · {item.publishedAt}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a></div>
      </article>
      <section className="reading-card"><p className="eyebrow">{item.mode === '演示' ? '演示阅读段落' : language==='en'?'完整正文已读取 · 英文解读 · 尚未翻译':'完整正文已读取 · 中文解读'}</p><p>{item.excerpt}</p><div className="terms">{terms.map((term) => <TermExplanation key={term.id} item={term} />)}</div></section>
      <div className="analysis-grid">
        <AnalysisBlock title="事实" tone="fact" items={item.facts} />
        <AnalysisBlock title="主流市场解释 · 机制参考" tone="consensus" items={item.consensus} />
        <AnalysisBlock title="AI 推演" tone="inference" items={item.inference} />
        <AnalysisBlock title="风险与反例" tone="risk" items={item.risks} />
      </div>
      {(data||language==='zh')&&<SoWhatSection data={data ?? soWhatForNews(item)} />}
      <section><h2>把事件连到知识点</h2><div className="lesson-tags">{knowledgeForEvent(item).map(lesson => <Link key={lesson.id} to={`/learn/${lesson.id}`}>{lesson.title} →</Link>)}</div><p><Link to="/learn">浏览全部学习目录 →</Link></p></section>
    </main>
  );
}
