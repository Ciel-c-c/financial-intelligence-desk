import { Link } from 'react-router-dom';
import { brief, knowledge, news } from '../data/demoData';

export function BriefPage() {
  const dailyKnowledge = knowledge.find((item) => item.id === brief.knowledgeId)!;
  return (
    <main className="page inner-page">
      <header className="page-title"><p className="eyebrow">DAILY MARKET BRIEF · {brief.mode}</p><h1>每日市场简报</h1><time>{brief.date}</time><p>{brief.headline}</p><small>生成于 {brief.generatedAt}</small></header>
      <section><h2 className="display-heading">重点事件</h2><div className="brief-list">{brief.newsIds.map((id, index) => { const item = news.find((entry) => entry.id === id)!; return <Link to={`/news/${id}`} key={id}><span>0{index + 1}</span><strong>{item.title}</strong><small>查看通俗解读 →</small></Link>; })}</div></section>
      <section className="watch-card"><p className="eyebrow">今天观察什么</p><ul>{brief.watchItems.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className="daily-knowledge"><p className="eyebrow">今天学一个</p><h2>{dailyKnowledge.term}</h2><p>{dailyKnowledge.definition}</p><Link to="/learn">去知识卡继续学 →</Link></section>
    </main>
  );
}
