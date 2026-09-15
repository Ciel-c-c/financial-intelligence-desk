import { Link } from 'react-router-dom';
import type { LiveNewsItem } from '../data/newsFeedTypes';
import { liveAnalysis } from '../data/liveAnalysis';

export function BriefStoryCard({story,index,item}:{story:{id:string;title:string;publishedAt:string;sourceName:string;sourceUrl:string};index:number;item?:LiveNewsItem}) {
  const analysis=item?liveAnalysis(item):undefined;
  return <article className="brief-story-card"><Link to={`/news/${story.id}`}><span>{String(index+1).padStart(2,'0')}</span><strong>{item?.titleZh??story.title}</strong><small>发布：{new Date(story.publishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})} · {story.sourceName}<br/>查看新闻与解读 →</small></Link>
    {item&&(item.summaryZh??item.originalSummary)&&<p><b>新闻摘要：</b>{item.summaryZh??item.originalSummary}</p>}
    {analysis?<><p><b>机制参考：</b>{analysis.item.consensus[0]}</p><p><b>真正重点：</b>{analysis.soWhat.focus.join('；')}。</p><p><b>成立条件与反例：</b>{analysis.item.risks[0]}</p></>:<p>现有证据不足以生成事件专属分析，请核对原始来源；不将标题当作完整解读。</p>}
    <a href={story.sourceUrl} target="_blank" rel="noreferrer">查看原始来源 ↗</a>
  </article>;
}
