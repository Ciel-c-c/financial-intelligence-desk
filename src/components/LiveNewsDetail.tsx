import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { isPublishableNews } from '../data/newsAdmission';
import { NewsArticle } from './NewsArticle';
export function LiveNewsDetail({item}:{item:LiveNewsItem}) {
  if(!isPublishableNews(item)) return <main className="page detail-page"><Link to="/">← 返回今日</Link><h1>新闻暂未发布</h1><p>来源摘要或正文尚不足以支持经过核验的解读。</p></main>;
  return <NewsArticle item={item.editorial!.item} data={item.editorial!.soWhat} language={item.editorial!.language??'zh'} evidenceScope={item.editorial!.evidenceScope} signals={item.editorial!.marketSignals}/>;
}
