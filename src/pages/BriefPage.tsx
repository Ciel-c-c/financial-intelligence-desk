import { Link } from 'react-router-dom';
import { useSiteData } from '../data/useSiteData';

export function BriefPage() {
  const { brief, loading, refresh } = useSiteData();
  const time = (value:string) => new Date(value).toLocaleString('zh-CN', { timeZone:'Asia/Shanghai', hour12:false });
  if (loading) return <main className="page inner-page"><p className="empty-state">正在读取最新简报…</p></main>;
  return <main className="page inner-page">
    <header className="page-title"><p className="eyebrow">DAILY MARKET BRIEF</p><h1>每日市场简报</h1><time>{brief ? time(brief.generatedAt) : '等待更新'}</time><p>先看重点事件，再顺着新闻理解为什么。</p><small>新闻按发布日期筛选。“8 月”可能是数据统计月份，并非新闻发布时间。</small></header>
    {!brief || brief.status === 'unavailable' ? <p className="empty-state">暂无足够的新事实生成可靠简报。<button onClick={refresh}>检查更新</button></p> : <>
      <section><h2 className="display-heading">重点事件</h2><div className="brief-list">{brief.stories?.length ? brief.stories.map((item,index) => <Link to={`/news/${item.id}`} key={item.id}><span>{String(index+1).padStart(2,'0')}</span><strong>{item.title}</strong><small>发布：{time(item.publishedAt)} · {item.sourceName}<br/>查看新闻与解读 →</small></Link>) : <p className="empty-state">当前简报缺少可定位的新闻条目，请检查更新。</p>}</div></section>
      <section className="watch-card"><p className="eyebrow">今天观察什么</p>{brief.watchItems.length ? <ul>{brief.watchItems.map(item => <li key={item}>{item}</li>)}</ul> : <p>对照原始发布中的收入、成本、需求与政策变化；尚无经过核验的下一次事件日程。</p>}{brief.marketFocus && <p>{brief.marketFocus.text}</p>}</section>
      <section className="daily-knowledge"><p className="eyebrow">今天学一个</p><h2>数据月份 ≠ 新闻发布日期</h2><p>经济指标通常滞后发布。今天公布的上月数据，也可能改变市场对当前经济的判断；关键是实际值与原先预期的差异。</p><Link to="/learn">去知识卡继续学 →</Link></section>
    </>}
  </main>;
}
