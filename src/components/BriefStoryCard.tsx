import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { isPublishableNews } from '../data/newsAdmission';
export function BriefStoryCard({index,item}:{story:{id:string;title:string;publishedAt:string;sourceName:string;sourceUrl:string};index:number;item?:LiveNewsItem}) {
  if(!item||!isPublishableNews(item)) return null;
  return <Link to={`/news/${item.id}`}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.editorial!.item.title}</strong><small>查看通俗解读 → · 新闻日期：{item.publishedAt.slice(0,10)} · {item.sourceName}</small></Link>;
}
