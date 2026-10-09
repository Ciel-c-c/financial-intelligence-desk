import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { presentNews,newsDateInBeijing } from '../data/newsPresentation';
export function BriefStoryCard({index,item}:{story:{id:string;title:string;publishedAt:string;sourceName:string;sourceUrl:string};index:number;item?:LiveNewsItem}) {
  const content=item?presentNews(item):undefined;if(!item||!content)return null;
  return <Link to={`/news/${item.id}`}><span>{String(index+1).padStart(2,'0')}</span><strong>{content.title}</strong><small>{content.kind==='summary'?'查看来源总结':'查看通俗解读'} → · 新闻日期：{newsDateInBeijing(item.publishedAt)} · {item.sourceName}</small></Link>;
}
