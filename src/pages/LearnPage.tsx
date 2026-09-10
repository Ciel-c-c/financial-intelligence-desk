import { useState } from 'react';
import { Link } from 'react-router-dom';
import { beginnerPath, filterLessons, lessons, sources, subjects } from '../data/curriculum';
import { useLearningProgress } from '../data/learningProgress';
import { LearningEvents } from '../components/LearningEvents';

export function LearnPage() {
  const [query,setQuery] = useState('');
  const [subject,setSubject] = useState('all');
  const [level,setLevel] = useState('all');
  const [status,setStatus] = useState('all');
  const { learned } = useLearningProgress();
  const filtered = filterLessons(query,subject,level).filter(item => status === 'all' || (status === 'learned' ? learned.includes(item.id) : !learned.includes(item.id)));
  function reset() { setQuery(''); setSubject('all'); setLevel('all'); setStatus('all'); }
  return <main className="page inner-page learning-center">
    <header className="learning-hero"><p className="eyebrow">THE ECONOMIC FIELD GUIDE / 学一点</p><h1>把世界的变化，<br />读成自己的判断。</h1><p>从一条新闻出发，或从一个问题开始。先理解机制，再检验条件。</p>
      <div className="learning-stats"><span><b>{subjects.length}</b> 个领域</span><span><b>{lessons.length}</b> 个核心知识点</span><span><b>{learned.length}/{lessons.length}</b> 已学会</span></div>
      <button className="map-jump" onClick={() => document.getElementById('knowledge-map')?.scrollIntoView({ block: 'start' })}>直接浏览全部知识 ↓</button>
    </header>
    <LearningEvents />
    <section className="beginner-path" aria-labelledby="path-title"><h2 id="path-title">Beginner 路径 · Level 0–4</h2><p>一条可选的入门主线。先修关系仅作建议，所有课程均可自由阅读；预计时长为阅读与思考参考。</p>
      <div className="path-steps">{beginnerPath.map(step => <button key={step.level} aria-pressed={level === String(step.level)} onClick={() => { setLevel(String(step.level)); setSubject('all'); setQuery(''); setStatus('all'); document.getElementById('knowledge-map')?.scrollIntoView({ block: 'start' }); }}><small>LEVEL {step.level}</small><strong>{step.title}</strong><span>{step.ids.filter(id => learned.includes(id)).length}/{step.ids.length} 主线已学</span></button>)}</div>
      <p className="muted">点选等级后，可在目录选择带「主线」标记的课程，也可随时扩展阅读。</p>
    </section>
    <section id="knowledge-map" className="knowledge-map" aria-labelledby="map-title"><div className="section-heading"><div><p className="eyebrow">EXPLORE ALL CONCEPTS</p><h2 id="map-title">全部知识地图</h2></div><button onClick={reset}>重置筛选</button></div>
      <div className="learning-filters"><label className="search-field"><span>搜索知识</span><input type="search" placeholder="知识点、CPI、汇率、指标…" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <label>知识领域<select value={subject} onChange={e => setSubject(e.target.value)}><option value="all">全部领域</option>{subjects.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label>学习难度<select value={level} onChange={e => setLevel(e.target.value)}><option value="all">全部等级</option>{beginnerPath.map(item => <option key={item.level} value={item.level}>Level {item.level} · {item.title}</option>)}</select></label>
        <label>学习状态<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">全部状态</option><option value="unlearned">尚未学会</option><option value="learned">已学会</option></select></label>
      </div>
      <p role="status" className="muted">显示 {filtered.length} / {lessons.length} 个知识点 · 学习进度仅保存在当前浏览器</p>
      {filtered.length === 0 && <p className="learning-empty">没有匹配的知识点</p>}
      <div className="subject-grid">{subjects.map((group,index) => {
        const items = filtered.filter(item => item.subject === group.id); if (!items.length) return null;
        return <section className="subject-section" key={group.id}><header><small>{String(index + 1).padStart(2,'0')}</small><div><h3>{group.title}</h3><p>{group.question}</p></div></header>
          <ul>{items.map(item => { const path = beginnerPath.find(step => step.ids.includes(item.id)); return <li key={item.id}><Link to={`/learn/${item.id}`}><div><strong>{item.title}</strong><span>{learned.includes(item.id) ? '✓ 已学会' : '↗'}</span></div><p>{item.conclusion}</p><small>Level {item.level} · {item.minutes} 分钟{path ? ` · 主线 ${path.ids.indexOf(item.id) + 1}` : ' · 自由拓展'}</small></Link></li>; })}</ul>
        </section>;
      })}</div>
    </section>
    <section className="learning-sources"><h2>继续深入 · 课程与书目</h2><p>本站为原创入门讲解，目录参考以下课程范围，不代表校方认证或完整大学课程。数学证明与习题可继续阅读原课程。</p><ul>{Object.values(sources).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>
      <p>金融市场与机构：Fabozzi 等《Foundations of Financial Markets and Institutions》；公司金融：Brealey、Myers、Allen《Principles of Corporate Finance》；行为金融：Shiller《Irrational Exuberance》。书目可在上述 Yale 课程页核对，版本以课程列示为准。</p>
    </section>
  </main>;
}
