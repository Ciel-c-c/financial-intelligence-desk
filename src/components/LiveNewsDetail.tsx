import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { isPublishableNews } from '../data/newsAdmission';
import { NewsArticle } from './NewsArticle';
export function LiveNewsDetail({item}:{item:LiveNewsItem}) {
  if(!isPublishableNews(item)) return <main className="page detail-page"><Link to="/">← 返回今日</Link><h1>新闻暂未发布</h1><p>尚未读取完整正文并完成中文解读核验，不展示标题或替代分析。</p></main>;
  return <NewsArticle item={item.editorial!.item} data={item.editorial!.soWhat}/>;
}
