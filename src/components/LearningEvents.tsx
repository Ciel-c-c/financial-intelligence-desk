import { Link } from 'react-router-dom';
import { knowledgeForEvent, learningEvents, learningNewsUpdatedAt } from '../data/learningEvents';
import { CausalChain } from './CausalChain';
export function LearningEvents() {
  return <section className="learning-events" aria-labelledby="learning-events-title">
    <div className="section-heading"><div><p className="eyebrow">EVENT → KNOWLEDGE</p><h2 id="learning-events-title">今日政治经济事件拆解</h2></div><span className="learning-badge">已有新闻快照</span></div>
    <p className="data-notice">未接入实时抓取 · 数据更新时间：{learningNewsUpdatedAt}。以下复用已有快照，非今日自动核验新闻；来源可用性与原文请自行核对，日期过期后仍按历史快照阅读。</p>
    <div className="event-list">{learningEvents.map(item => {
      const linked = knowledgeForEvent(item); const mechanism = linked[0];
      return <article className="learning-event" key={item.id}>
        <header><small>{item.publishedAt} · {item.sourceName} · 快照</small><h3>{item.title}</h3><p>{item.summary}</p></header>
        <div className="evidence-grid">
          <section><h4>事实 · 原快照记录</h4><ul>{item.facts.map(value => <li key={value}>{value}</li>)}</ul><a href={item.sourceUrl} target="_blank" rel="noreferrer">核对来源原文 ↗</a></section>
          <section><h4>主流市场解释 · 机制参考，非共识调查</h4><ul>{item.consensus.map(value => <li key={value}>{value}</li>)}</ul></section>
          <section><h4>推演 · 有条件，非预测</h4><ul>{item.inference.map(value => <li key={value}>{value}</li>)}</ul></section>
        </div>
        <details><summary>展开来龙去脉与因果链</summary>
          <h4>背景与来龙去脉</h4><p>{item.excerpt}</p>
          {mechanism && <><h4>关键角色与利益关系 · 通用机制</h4><p>{mechanism.actors}</p></>}
          <h4>因果链 · 条件推演</h4><CausalChain steps={item.causalChain} />
          <h4>对经济、行业与资产的影响 · 推演</h4><p>{item.inference.join(' ')}</p>
          <h4>哪些变量会改变结论</h4><p>{item.risks.join(' ')}</p>
          {mechanism && <><p>观察指标：{[...new Set(linked.flatMap(lesson => lesson.indicators))].join(' / ')}</p><h4>常见误区</h4><p>{mechanism.misconception}</p><h4>一句话记住</h4><p>{mechanism.takeaway}</p></>}
          <Link to={`/news/${item.id}`}>阅读完整新闻档案 →</Link>
        </details>
        <nav className="lesson-tags" aria-label={`${item.title}相关知识`}>{linked.map(lesson => <Link key={lesson.id} to={`/learn/${lesson.id}`}>{lesson.title} ↗</Link>)}</nav>
      </article>;
    })}{learningEvents.length === 0 && <p>暂无可映射的政治经济新闻快照。可直接从知识地图开始学习。</p>}</div>
  </section>;
}
