import { Link,useParams } from 'react-router-dom';
import { useNewsFeed } from '../data/useNewsFeed';
import { findLiveNewsById } from '../data/selectors';
import { LiveNewsDetail } from '../components/LiveNewsDetail';
export function NewsDetailPage(){
  const {id=''}=useParams();const {snapshot,loading}=useNewsFeed();
  const item=findLiveNewsById(snapshot,id);
  if(item) return <LiveNewsDetail item={item}/>;
  if(loading) return <main className="page detail-page"><p>正在加载资讯…</p></main>;
  return <main className="page detail-page"><Link to="/">← 返回今日</Link><h1>没有找到这条资讯</h1><p>尚未获得充分来源信息或完成解读核验。请返回首页查看已发布新闻。</p></main>;
}
