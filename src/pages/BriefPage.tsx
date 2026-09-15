import { Link } from 'react-router-dom';
import { useSiteData } from '../data/useSiteData';
import { useNewsFeed } from '../data/useNewsFeed';
import { isRecentNews } from '../data/newsDates';
import { isPublishableNews } from '../data/newsAdmission';
import { BriefStoryCard } from '../components/BriefStoryCard';
export function BriefPage(){
  const {brief}=useSiteData();const {snapshot,loading}=useNewsFeed();
  const all=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].filter(isPublishableNews).filter(item=>Date.parse(item.publishedAt)<=Date.now()).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  const recent=all.filter(item=>isRecentNews(item.publishedAt));
  const stories=(recent.length?recent:all).slice(0,8);
  const watchItems=[...new Set(stories.flatMap(item=>item.editorial!.watchItems))].slice(0,5);
  const date=stories[0]?.publishedAt.slice(0,10);
  return <main className="page inner-page">
    <header className="page-title"><p className="eyebrow">DAILY MARKET BRIEF</p><h1>每日市场简报</h1><time>{date??'等待更新'}</time><p>{recent.length?stories[0].summaryZh:'暂无近24小时已核验完整新闻；以下保留此前报道，不作为今日重点。'}</p><small>生成于 {brief?new Date(brief.generatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):'等待简报生成'}（北京时间） · 新闻日期逐条标注</small></header>
    <section><h2 className="display-heading">{recent.length?'重点事件':'此前重点事件 · 背景参考'}</h2><div className="brief-list">{stories.length?stories.map((item,index)=><BriefStoryCard key={item.id} index={index} item={item} story={{id:item.id,title:item.titleZh!,publishedAt:item.publishedAt,sourceName:item.sourceName,sourceUrl:item.canonicalUrl}}/>):<p className="empty-state">{loading?'正在读取完整新闻…':'暂无足够的新事实生成可靠简报；未读取完整正文的新闻不展示。'}</p>}</div></section>
    {watchItems.length>0&&<section className="watch-card"><p className="eyebrow">{recent.length?'今天观察什么':'接下来观察 · 背景参考'}</p><ul>{watchItems.map(item=><li key={item}>{item}</li>)}</ul></section>}
    <section className="daily-knowledge"><p className="eyebrow">今天学一个</p><h2>实际变化与预期差</h2><p>判断一条新闻，不只看数字是否增长，还要对照市场原先预期，并检查它影响收入、成本还是利润。</p><Link to="/learn">去知识卡继续学 →</Link></section>
  </main>;
}
