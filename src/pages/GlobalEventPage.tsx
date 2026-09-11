import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EventCausalChain } from '../components/EventCausalChain';
import { FreshnessBanner } from '../components/FreshnessBanner';
import { MarketRelevance } from '../components/MarketRelevance';
import { findLesson } from '../data/curriculum';
import { findGlobalEvent, formatSnapshotTime } from '../data/globalSituation';
import { globalSituationSeed } from '../data/globalSituationSeed';
import { useGlobalSituation } from '../data/useGlobalSituation';

export function GlobalEventPage() {
  const { id = '' } = useParams(); const snapshot = useGlobalSituation();
  const item = findGlobalEvent(snapshot.events,id) ?? findGlobalEvent(globalSituationSeed.events,id);
  const [asset,setAsset] = useState('');
  if (!item) return <main className="page detail-page"><Link to="/situation">← 返回全球局势</Link><h1>未找到这个事件</h1><p>快照可能已更新，请返回查看当前事件。</p></main>;
  const currentAsset = item.relatedAssets.find(entry => entry.name === asset);
  return <main className="page situation-detail">
    <Link className="back-link" to="/situation">← 返回全球局势</Link>
    <FreshnessBanner snapshot={snapshot} />
    <header className="situation-detail-head"><div><p className="eyebrow">GLOBAL SITUATION / {item.region.toUpperCase()}</p><MarketRelevance relevance={item.relevance} /></div><h1>{item.headline}</h1><p>{item.oneLine}</p><div className="source-meta"><span>事件发布时间：{formatSnapshotTime(item.publishedAt)}</span><span>本条抓取时间：{formatSnapshotTime(item.fetchedAt)}</span></div></header>
    <section className="one-line-card"><span>① 一句话看懂</span><p>{item.oneLine}</p></section>
    <div className="evidence-grid">
      <section><span className="evidence-tag fact-tag">FACT｜事实</span><h2>发生了什么</h2>{item.sourceHeadline && <p className="source-headline">原始标题：{item.sourceHeadline}</p>}<ul>{item.fact.map(fact => <li key={fact}>{fact}</li>)}</ul><div className="event-sources"><b>原始来源</b>{item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} · {formatSnapshotTime(source.publishedAt)} ↗</a>)}</div></section>
      <section><span className="evidence-tag market-tag">MARKET VIEW｜市场解释</span><h2>为什么市场在乎</h2><ul>{item.marketView.map(view => <li key={view}>{view}</li>)}</ul></section>
      <section><span className="evidence-tag scenario-tag">SCENARIO｜情景推演</span><h2>如果条件持续</h2><ul>{item.scenarios.map(scenario => <li key={scenario}>{scenario}</li>)}</ul><small>推演不是事实，也不是涨跌预测。</small></section>
    </div>
    <section className="simple-example"><div className="example-visual" aria-hidden="true"><span>日常成本</span><i>→</i><span>企业账单</span><i>→</i><span>你的资产</span></div><div><p className="eyebrow">PLAIN LANGUAGE FIRST</p><h2>举个简单例子</h2><p>{item.simpleExample}</p><aside><b>专业一点说：</b>{item.professionalConcept}</aside></div></section>
    <section className="chain-section"><p className="eyebrow">CONDITIONAL CAUSALITY</p><h2>影响链</h2><p>点开每一步看小白解释。带“可能”的箭头表示这一步需要条件成立。</p><EventCausalChain nodes={item.causalChain} /></section>
    <section className="conditional-tree"><p className="eyebrow">WHAT IS THE MARKET ACTUALLY PRICING?</p><h2>市场正在交易什么？</h2><div><span>事件是否改变真实供给、需求或政策？</span><b>如果 YES ↓</b><span>影响能否持续并传到企业成本或收入？</span><b>如果 YES ↓</b><span>是否改变通胀、利率或盈利预期？</span><b>然后才讨论资产价格</b></div></section>
    <section className="sensitive-assets"><div className="section-heading"><div><p className="eyebrow">SENSITIVE ASSETS</p><h2>哪些资产最敏感</h2></div><span>点击查看原因</span></div><div className="asset-buttons">{item.relatedAssets.map(entry => <button key={entry.name} type="button" aria-pressed={asset === entry.name} onClick={() => setAsset(asset === entry.name ? '' : entry.name)}><span>{entry.symbol ?? '◇'}</span>{entry.name}</button>)}</div>{currentAsset && <p className="asset-explanation" role="status"><b>{currentAsset.name}</b>{currentAsset.explanation}</p>}</section>
    <section className="market-reaction"><p className="eyebrow">OBSERVED PRICE ACTION</p><h2>市场已经怎么反应</h2>{item.marketReaction.length ? <div className="reaction-table" role="table" aria-label="事件后的市场反应">{item.marketReaction.map(reaction => <div role="row" key={`${reaction.asset}-${reaction.window}`}><b role="cell">{reaction.asset}</b><strong role="cell">{reaction.change}</strong><span role="cell">{reaction.window}</span><small role="cell">数据时间：{formatSnapshotTime(reaction.asOf)} · <a href={reaction.sourceUrl}>{reaction.sourceName}</a></small></div>)}</div> : <p className="no-data">暂无可靠市场价格数据</p>}<p className="data-caveat">价格同期变化只能说明市场发生了什么，不能单独证明是该事件造成。</p></section>
    <section className="change-view"><p className="eyebrow">DISCONFIRMING CONDITIONS</p><h2>什么会改变结论？</h2><p>金融分析不是把未来说死，而是持续检查条件。</p><ul>{item.conditionsThatChangeView.map(condition => <li key={condition}>{condition}</li>)}</ul></section>
    <section className="learn-bridge"><p className="eyebrow">FROM NEWS TO KNOWLEDGE</p><h2>想真正看懂这件事？</h2><p>把今天的事件变成以后还能用的判断框架。</p><div>{item.knowledgeIds.map(findLesson).filter(Boolean).map(lesson => <Link key={lesson!.id} to={`/learn/${lesson!.id}`}>{lesson!.title}<span>Level {lesson!.level} · {lesson!.minutes} 分钟 →</span></Link>)}</div></section>
  </main>;
}
