import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { beginnerPath, findLesson, sources, subjects } from '../data/curriculum';
import type { Lesson } from '../data/curriculum';
import { learningEvents, knowledgeForEvent } from '../data/learningEvents';
import { useLearningProgress } from '../data/learningProgress';
import { eventsForKnowledge } from '../data/globalSituation';
import { globalSituationSeed } from '../data/globalSituationSeed';

function explainBackground(value: string) {
  const sentences = value.match(/[^。！？]+[。！？]?/g)?.map(item => item.trim()).filter(Boolean) ?? [value];
  return { example:sentences[0], professional:sentences.slice(1).join('') || value };
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  const [answer,setAnswer] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  useEffect(() => { pageRef.current?.scrollIntoView?.({ block: 'start' }); }, []);
  const { learned, update, saveError } = useLearningProgress();
  const group = subjects.find(item => item.id === lesson.subject)!;
  const source = sources[group.source as keyof typeof sources];
  const related = learningEvents.filter(item => knowledgeForEvent(item).some(point => point.id === lesson.id));
  const situationEvents = eventsForKnowledge(globalSituationSeed.events,lesson.id);
  const explanation = explainBackground(lesson.background);
  const path = beginnerPath.flatMap(step => step.ids);
  const nextId = path.includes(lesson.id) ? path[path.indexOf(lesson.id) + 1] : undefined;
  const next = nextId ? findLesson(nextId) : undefined;
  return <main ref={pageRef} className="page inner-page lesson-page">
    <Link className="back-link" to="/learn">← 返回全部知识地图</Link>
    <header className="lesson-header"><p className="eyebrow">{group.title} / LEVEL {lesson.level}</p><h1>{lesson.title}</h1><p className="lesson-lead">{lesson.conclusion}</p><small>预计 {lesson.minutes} 分钟 · 自由阅读，无需解锁</small>
      <label className="learn-check"><input type="checkbox" checked={learned.includes(lesson.id)} onChange={e => update(lesson.id,e.target.checked)} />标记已学会</label>{saveError && <p role="alert">浏览器无法保存进度，本次仍可继续阅读。</p>}
    </header>
    <aside className="lesson-prerequisites"><strong>建议先修</strong><div className="lesson-tags">{lesson.prerequisites.length ? lesson.prerequisites.map(id => <Link key={id} to={`/learn/${id}`}>{findLesson(id)?.title} {learned.includes(id) ? '✓' : '↗'}</Link>) : <span>无需先修，从这里开始即可。</span>}</div></aside>
    <article className="lesson-body">
      <section><h2>先说结论</h2><p>{lesson.conclusion}</p></section>
      <section className="lesson-example"><p className="eyebrow">PLAIN LANGUAGE FIRST</p><h2>举个简单例子</h2><p>{explanation.example}</p><aside><b>专业一点说：</b>{explanation.professional}</aside></section>
      <section><h2>关键角色与利益关系</h2><p>{lesson.actors}</p></section>
      <section><h2>因果链</h2><p className="muted">教学机制：其他条件变化时，链条可能中断。</p><ol className="lesson-chain">{lesson.chain.map((step,index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol></section>
      <section><h2>对经济、行业与资产的影响</h2><p>{lesson.impact}</p></section>
      <section><h2>哪些变量会改变结论</h2><p>{lesson.variables}</p></section>
      <section><h2>常见误区</h2><p>{lesson.misconception}</p></section>
      <section className="lesson-takeaway"><h2>一句话记住</h2><p>{lesson.takeaway}</p></section>
    </article>
    <section className="lesson-indicators"><h2>相关市场指标</h2><p>用于跟踪机制的指标清单，以下未展示实时数值。</p><div className="lesson-tags">{lesson.indicators.map(item => <span key={item}>{item}</span>)}</div></section>
    <section className="lesson-related"><h2>相关现实事件 · 已有新闻快照</h2>{related.length ? <ul>{related.map(item => <li key={item.id}><Link to={`/news/${item.id}`}>{item.title} →</Link><small>{item.publishedAt} · {item.sourceName} · 非实时</small></li>)}</ul> : <p>当前快照库暂无直接对应事件。可用本课机制分析未来资讯，不以虚构新闻补位。</p>}</section>
    <section className="lesson-related situation-related"><h2>最近全球局势案例</h2>{situationEvents.length ? <ul>{situationEvents.map(item => <li key={item.id}><Link to={`/situation/${item.id}`}>{item.headline} →</Link><small>用本课知识检查：{item.oneLine}</small></li>)}</ul> : <p>当前发布快照暂无直接案例。遇到新事件时，可用本课的变量与反例自行判断。</p>}<p><Link to="/situation">浏览全球局势 →</Link></p></section>
    <section className="lesson-quiz"><h2>快速自测</h2><p>{lesson.question}</p><button onClick={() => setAnswer(!answer)} aria-expanded={answer}>{answer ? '收起答案' : '查看答案'}</button>{answer && <p className="quiz-answer">{lesson.answer}</p>}</section>
    <footer className="lesson-footer"><a href={source.url} target="_blank" rel="noreferrer">延伸学习：{source.title} ↗</a>{next && <Link to={`/learn/${next.id}`}>主线下一课：{next.title} →</Link>}<Link to="/learn">选择其他知识点 →</Link></footer>
  </main>;
}
export function LessonPage() {
  const { id } = useParams(); const lesson = findLesson(id ?? '');
  return lesson ? <LessonContent key={lesson.id} lesson={lesson} /> : <main className="page inner-page"><h1>未找到这个知识点</h1><Link to="/learn">返回全部知识地图</Link></main>;
}
