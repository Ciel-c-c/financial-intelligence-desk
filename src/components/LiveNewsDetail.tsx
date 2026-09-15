import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { liveAnalysis } from '../data/liveAnalysis';
import { AnalysisBlock } from './AnalysisBlock';
import { NewsSourcePanel } from './NewsSourcePanel';
import { SoWhatSection } from './SoWhatSection';

export function LiveNewsDetail({item}:{item:LiveNewsItem}) {
  const analysis=liveAnalysis(item);
  const tags=[...item.analysisLevels,...item.eventTypes,...item.impactChannels,...item.regions];
  return <main className="page detail-page">
    <Link className="back-link" to="/">← 返回今日</Link>
    <article className="article-head"><div className="news-tags">{tags.map(tag=><span className="topic" key={tag}>{tag}</span>)}</div><h1>{item.titleZh??item.originalTitle}</h1><p className="lead">{item.summaryZh??item.originalSummary}</p>{item.translationStatus==='generated'&&<p className="eyebrow">中文整理 · 非官方译文</p>}{item.titleZh&&item.titleZh!==item.originalTitle&&<p>原标题：{item.originalTitle}</p>}<div className="source-row"><span>{item.sourceName} · {new Date(item.publishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</span></div></article>
    <NewsSourcePanel item={item}/>
    {item.translationStatus==='generated'&&<details className="watch-card"><summary>核对英文原文</summary><h3>{item.originalTitle}</h3><p>{item.originalSummary}</p></details>}
    <p className="section-intro">证据边界：事实来自已收录的原始标题与摘要，不代表已核验全文。机制参考是条件性解释，不是本次市场反应的已证实原因。</p>
    <div className="analysis-grid"><AnalysisBlock title="事实" tone="fact" items={item.facts}/><AnalysisBlock title="市场预期" tone="consensus" items={item.expectations.length?item.expectations:['尚未取得可核验的事前预期，不能判断是否超预期。']}/>{analysis&&<AnalysisBlock title="专业解读 · 机制参考" tone="consensus" items={analysis.item.consensus}/>}<AnalysisBlock title="推断" tone="inference" items={item.inferences.length?item.inferences:['暂无经过事件证据支持的进一步推断。']}/><AnalysisBlock title="风险与反例" tone="risk" items={analysis?.item.risks??['现有证据不足以建立完整传导链，请先核对原始发布及后续进展。']}/></div>
    {analysis?<SoWhatSection data={analysis.soWhat}/>:<section className="watch-card"><h2>所以呢？</h2><p>暂未形成可靠的事件专属解读。保留事实与来源，不用其他新闻的解释填充。</p></section>}
  </main>;
}
