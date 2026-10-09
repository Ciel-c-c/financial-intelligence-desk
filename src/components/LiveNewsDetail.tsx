import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { isPublishableNews,isPublishableSummary } from '../data/newsAdmission';
import { NewsArticle } from './NewsArticle';
export function LiveNewsDetail({item}:{item:LiveNewsItem}) {
  if(isPublishableSummary(item)) return <main className="page detail-page"><Link to="/">← 返回今日</Link><p className="eyebrow">来源事实总结 · 尚未生成深度解读</p><h1>{item.originalTitle}</h1><p>{item.originalSummary}</p><p>{item.sourceName} · <time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</time></p><a href={item.canonicalUrl} target="_blank" rel="noreferrer">查看原始来源 ↗</a><section className="reading-card"><h2>解读状态</h2><p>以上是来源摘要，不是独立核验后的经济分析。尚未完成因果、预期和个人影响解读，不据此生成涨跌信号。</p></section></main>;
  if(!isPublishableNews(item)) return <main className="page detail-page"><Link to="/">← 返回今日</Link><h1>新闻暂未发布</h1><p>来源摘要或正文尚不足以支持经过核验的解读。</p></main>;
  return <NewsArticle item={item.editorial!.item} data={item.editorial!.soWhat} language={item.editorial!.language??'zh'} evidenceScope={item.editorial!.evidenceScope} signals={item.editorial!.marketSignals} relatedSources={item.relatedSources}/>;
}
