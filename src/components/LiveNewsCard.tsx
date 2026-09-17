import {Link} from 'react-router-dom';import type{LiveNewsItem}from'../data/newsFeedTypes';
export function LiveNewsCard({item}:{item:LiveNewsItem}) {
 const tags=[...item.analysisLevels,...item.eventTypes,...item.impactChannels,...item.regions].slice(0,5);
 const english=item.editorial?.language==='en';
 const title=english?item.titleEn:item.titleZh,summary=english?item.summaryEn:item.summaryZh;
 return <article className="news-card live-news-card"><div className="news-tags">{tags.map(tag=><span className="topic" key={tag}>{tag}</span>)}</div><Link to={`/news/${item.id}`}><h3>{title??item.originalTitle}</h3></Link><p>{summary??item.originalSummary??'查看原始来源了解详情。'}</p><footer><a href={item.canonicalUrl} target="_blank" rel="noreferrer">{item.sourceName}{english?' · 英文解读 · 尚未翻译':item.translationStatus==='generated'?' · 非官方中文整理':''} ↗</a><time dateTime={item.publishedAt}>新闻发布：{new Date(item.publishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</time></footer></article>;
}
