import { Link } from 'react-router-dom';
import { AnalysisBlock } from './AnalysisBlock';
import { TermExplanation } from './TermExplanation';
import { SoWhatSection } from './SoWhatSection';
import { knowledge } from '../data/demoData';
import { knowledgeForEvent } from '../data/learningEvents';
import { soWhatForNews } from '../data/soWhat';
import type { NewsItem,SoWhatData } from '../data/types';
import type { MarketSignal,RelatedNewsSource } from '../data/newsFeedTypes';
export function NewsArticle({item,data,language='zh',evidenceScope,signals,relatedSources}:{item:NewsItem;data?:SoWhatData;language?:'zh'|'en';evidenceScope?:'summary'|'full-body';signals?:MarketSignal[];relatedSources?:RelatedNewsSource[]}) {
  const terms = knowledge.filter((term) => item.termIds.includes(term.id));
  return (
    <main className="page detail-page">
      <Link className="back-link" to="/">← 返回今日</Link>
      <article className="article-head">
        <div className="card-row"><span className="topic">{item.region} · {item.topic}</span><span className="demo-badge">{item.mode}</span></div>
        <h1>{item.title}</h1><p className="lead">{item.summary}</p>
        <div className="source-row"><span>{item.sourceName} · {item.publishedAt}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a></div>
        {!!relatedSources?.length&&<div className="source-row"><span>补充核验来源</span>{relatedSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} · {source.publishedAt} ↗</a>)}</div>}
      </article>
      <section className="reading-card"><p className="eyebrow">{item.mode === '演示' ? '演示阅读段落' : evidenceScope==='summary'?(language==='en'?'基于来源摘要 · 英文解读 · 尚未翻译':'基于来源摘要 · 中文解读'):language==='en'?'完整正文已读取 · 英文解读 · 尚未翻译':'完整正文已读取 · 中文解读'}</p><p>{item.excerpt}</p><div className="terms">{terms.map((term) => <TermExplanation key={term.id} item={term} />)}</div></section>
      <div className="analysis-grid">
        <AnalysisBlock title="事实" tone="fact" items={item.facts} />
        <AnalysisBlock title="主流市场解释 · 机制参考" tone="consensus" items={item.consensus} />
        <AnalysisBlock title="AI 推演" tone="inference" items={item.inference} />
        <AnalysisBlock title="风险与反例" tone="risk" items={item.risks} />
      </div>
      {!!signals?.length&&<section className="reading-card"><h2>条件性涨跌信号</h2><p className="eyebrow">描述可能的市场压力，方向仍取决于条件和原先预期</p>{signals.map((signal,index)=><div key={index}><h3>{signal.direction==='上行'?'↑':signal.direction==='下行'?'↓':signal.direction==='分化'?'↔':'—'} {signal.asset} · {signal.direction}压力 · {signal.timeframe}</h3><p>{signal.reason}</p><p>成立条件：{signal.condition}</p><p>什么情况下失效：{signal.invalidation}</p></div>)}</section>}
      {(data||language==='zh')&&<SoWhatSection data={data ?? soWhatForNews(item)} />}
      <section><h2>把事件连到知识点</h2><div className="lesson-tags">{knowledgeForEvent(item).map(lesson => <Link key={lesson.id} to={`/learn/${lesson.id}`}>{lesson.title} →</Link>)}</div><p><Link to="/learn">浏览全部学习目录 →</Link></p></section>
    </main>
  );
}
