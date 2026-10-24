import { WorldEventCards } from '../components/WorldEventCards';
import { Link } from 'react-router-dom';
import { NewsFeedSections } from '../components/NewsFeedSections';
import { useNewsFeed } from '../data/useNewsFeed';
export function TodayPage() {
 const {snapshot,loading,error}=useNewsFeed();
 return <main className="page today-page">
  <header className="page-title"><p className="eyebrow">NEWS &amp; KNOWLEDGE</p><h1>资讯</h1><p>阅读可靠来源新闻，按需查看金融影响解读。</p>
  <nav className="lesson-tags" aria-label="内容入口"><Link to="/situation">全球局势 →</Link><Link to="/learn">金融知识库 →</Link><Link to="/brief">每日简报 →</Link></nav></header>
  <WorldEventCards/>
  <NewsFeedSections snapshot={snapshot} loading={loading} error={error} showFilters={false}/>
 </main>;
}

