import {useEffect} from 'react';
import {Link,useLocation,useParams,useSearchParams} from 'react-router-dom';
import {findWorldEvent} from '../data/worldEvents/registry';
import {findLesson} from '../data/curriculum';
import {isClaimAvailable} from '../data/worldEvents/validation';
import {loadEventPosition,saveEventPosition} from '../data/worldEvents/readingState';
import {ClaimView,EventSection} from '../components/EventReadingParts';
import type {WorldEvent} from '../data/worldEvents/types';

function EventReader({event}:{event:WorldEvent}){
 const [params,setParams]=useSearchParams();const location=useLocation();
 const branch=event.branches.find(b=>b.id===params.get('path'))??event.branches[0];
 const selected=branch&&(branch.nodeIds.includes(params.get('node.'+branch.id)??'')?params.get('node.'+branch.id)!:branch.nodeIds[0]);
 const concept=event.concepts.find(c=>c.id===params.get('concept'));
 const choice=params.get('choice');const checked=params.get('checked')==='1'&&event.quiz.options.some(o=>o.id===choice);
 const returnTo=location.pathname+location.search;
 function update(values:Record<string,string|null>){setParams(old=>{const next=new URLSearchParams(old);Object.entries(values).forEach(([k,v])=>v===null?next.delete(k):next.set(k,v));return next;},{replace:true,preventScrollReset:true});}
 useEffect(()=>{const timer=window.setTimeout(()=>{window.scrollTo(0,loadEventPosition(returnTo));},0);return ()=>window.clearTimeout(timer);},[]);
 const jump=()=>document.getElementById('event-explore')?.scrollIntoView?.({block:'start'});
 const interactive=event.experience==='interactive';
 const section=(id:string)=><EventSection key={id} event={event} id={id} open={params.get('open.'+id)==='1'} onOpenChange={open=>update({['open.'+id]:open?'1':null})}/>;
 return <main className="page event-reading p-main event-page" tabIndex={-1}>
 <Link className="p-back" to="/">← 返回资讯</Link>
 <header className="p-event-head"><p className="p-kicker">{event.domain.join(' · ')}</p><h1>{event.question}</h1><div className="p-meta"><span>历史案例 · {event.period.label}</span><span>{interactive?'交互解读':'基础解读'}</span><span>整理 {event.curatedAt}</span></div><p className="p-lead">{event.summary}</p><p className="p-note">案例覆盖期：{event.period.start} 至 {event.period.end}。历史结果不作为今日新进展。</p></header>
 {interactive? <>{section('current')}{section('background')}{section('history')}</>:event.sections.map(s=>section(s.id))}
 {branch&&<section className="p-glass p-section p-explore" id="event-explore"><p className="p-kicker">因果探索</p><h2>选择一条影响路径</h2><div className="p-paths" role="group" aria-label="选择因果路径">{event.branches.map(b=><button key={b.id} aria-label={b.label+'路径'} aria-pressed={branch.id===b.id} onClick={()=>update({path:b.id})}>{b.label}</button>)}</div><div className="p-path-intro"><h3>{branch.question}</h3><p>{branch.intro}</p></div><p className="p-boundary">{branch.boundary}</p><ol className="p-chain" aria-label={branch.label+'传导路径'}>{branch.nodeIds.map((id,index)=>{const node=event.nodes.find(n=>n.id===id)!;const edge=index?event.edges.find(e=>e.from===branch.nodeIds[index-1]&&e.to===id):undefined;const edgeClaim=edge&&event.claims.find(c=>c.id===edge.explanationClaimId);const validEdge=!!edgeClaim&&isClaimAvailable(event,edgeClaim);return <li key={id}>{index>0&&<div className="p-connector">{validEdge?'↓ 还要看下一步条件':'连接证据待复核，暂不作传导结论'}</div>}<button className="p-node" aria-expanded={selected===id} aria-controls={'event-node-'+id} onClick={()=>update({['node.'+branch.id]:id})}><span className="p-step-num">{String(index+1).padStart(2,'0')}</span><span>{node.title}</span><span aria-hidden="true">{selected===id?'−':'+'}</span></button>{selected===id&&<div className="p-node-body" id={'event-node-'+id}>{node.claimIds.map(cid=><ClaimView key={cid} event={event} id={cid} conditions/>)}</div>}</li>;})}</ol></section>}
 <section className="p-reading" id="event-concepts"><h2>相关经济原理</h2><div className="p-concepts">{event.concepts.map(c=><div key={c.id} className="p-concept"><button aria-label={(concept?.id===c.id?'收起':'展开')+'概念：'+c.title} aria-expanded={concept?.id===c.id} aria-controls={'concept-'+c.id} onClick={()=>update({concept:concept?.id===c.id?null:c.id})}><span>{c.title}</span><span aria-hidden="true">{concept?.id===c.id?'−':'+'}</span></button>{concept?.id===c.id&&<div className="p-definition" id={'concept-'+c.id}><p>{c.explanation}</p><p className="p-note">回到事件：{c.example}</p>{c.lessonIds.map(id=><Link className="p-lesson-link" key={id} aria-label={'学习课程：'+findLesson(id)!.title} to={'/learn/'+id+'?returnTo='+encodeURIComponent(returnTo)} onClick={()=>saveEventPosition(returnTo)}>学习课程：{findLesson(id)!.title} →</Link>)}</div>}</div>)}</div></section>
 {interactive&&<>{section('reality')}{section('market')}</>}
 <details className="p-disclosure event-timeline" open={params.get("timeline")==="1"} onToggle={e=>{if(e.currentTarget.open!==(params.get("timeline")==="1"))update({timeline:e.currentTarget.open?"1":null});}}><summary onClick={e=>{e.preventDefault();update({timeline:params.get("timeline")==="1"?null:"1"});}}>事件时间线与证据</summary>{event.timeline.filter(t=>t.claimIds.every(id=>{const c=event.claims.find(c=>c.id===id);return c&&isClaimAvailable(event,c);})).map(t=><article key={t.id}><h3><time>{t.occurredAt}</time> · {t.label}</h3><p className="p-note">{t.knownAt?'公开信息时间：'+t.knownAt:'公开可知时间未独立确认，按事后回顾阅读。'}</p>{t.claimIds.map(id=><ClaimView key={id} event={event} id={id}/>)}</article>)}</details>
 <section className="p-glass p-section p-quiz"><h2>情境理解测试</h2><p>{event.quiz.prompt}</p><fieldset><legend>哪一种推理更站得住脚？</legend>{event.quiz.options.map(o=><label key={o.id} className={choice===o.id?'selected':''}><input type="radio" name="event-quiz" checked={choice===o.id} onChange={()=>update({choice:o.id,checked:null})}/><span>{o.text}</span></label>)}</fieldset><button className="p-primary" disabled={!event.quiz.options.some(o=>o.id===choice)} onClick={()=>update({checked:'1'})}>看看我的推理</button>{checked&&<div className={'p-feedback '+(choice===event.quiz.correctId?'correct':'')} role="status"><strong>{choice===event.quiz.correctId?'你抓住了关键。':'再检查被跳过的条件。'}</strong><p>{event.quiz.explanation}</p>{event.quiz.revisitNodeId&&<button className="p-text-button" onClick={()=>{const b=event.branches.find(b=>b.nodeIds.includes(event.quiz.revisitNodeId!))!;update({path:b.id,['node.'+b.id]:event.quiz.revisitNodeId!});jump();}}>回看相关因果节点 ↑</button>}</div>}</section>
 <footer className="p-footer"><p>{event.marketCoverage.reason}</p><p>来源为人工核对的参考链接；没有自动生成的市场预测或买卖建议。</p><Link className="p-back" to="/">← 返回资讯</Link></footer>
 </main>;
}
export function WorldEventPage(){const {id=''}=useParams();const event=findWorldEvent(id);return event?<EventReader key={event.id} event={event}/>:<main className="page inner-page"><h1>暂未提供这个事件</h1><p>此内容未整理或需要复核，实时资讯仍可正常阅读。</p><Link to="/">返回资讯</Link></main>;}


