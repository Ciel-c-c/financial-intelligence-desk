import type {WorldEvent,ClaimKind} from '../data/worldEvents/types';
import {isClaimAvailable} from '../data/worldEvents/validation';
export const claimLabels:Record<ClaimKind,string>={fact:'已核对事实',mechanism:'机制解释',scenario:'条件性预测',uncertain:'尚不确定',illustration:'假设例子','market-observation':'市场观察'};
export function EventBadge({kind}:{kind:ClaimKind}){return <span className={'p-badge '+kind}>{claimLabels[kind]}</span>;}
export function ClaimView({event,id,conditions=false}:{event:WorldEvent;id:string;conditions?:boolean}){
 const c=event.claims.find(c=>c.id===id);if(!c)return null;
 if(!isClaimAvailable(event,c))return <p className="p-note">这段解释的证据需要复核，暂不展示原结论。</p>;
 return <div className="event-claim"><EventBadge kind={c.kind}/><p className="event-claim-text">{c.text}</p>{conditions&&c.conditions.length>0&&<div className="p-condition"><b>成立条件</b>{c.conditions.map(value=><p key={value}>{value}</p>)}</div>}{c.invalidators.length>0&&conditions&&<div className="p-condition"><b>可能打断这一步的条件</b>{c.invalidators.map(value=><p key={value}>{value}</p>)}</div>}{c.unknowns.length>0&&<p className="p-note">证据边界：{c.unknowns.join('；')}</p>}{c.evidenceRefs.filter(r=>r.relation!=='contradicts').map(ref=>{const e=event.evidence.find(e=>e.id===ref.evidenceId)!;return <a key={e.id} className="p-source" href={e.url} target="_blank" rel="noreferrer">{e.title} <span aria-hidden="true">↗</span><span className="sr-only">（新标签页）</span></a>;})}</div>;
}
export function EventSection({event,id,open=false,onOpenChange}:{event:WorldEvent;id:string;open?:boolean;onOpenChange?:(open:boolean)=>void}){
 const section=event.sections.find(s=>s.id===id);if(!section)return null;
 const body=section.claimIds.map(cid=><ClaimView key={cid} event={event} id={cid}/>);
 return section.collapsed?<details className="p-disclosure event-section" open={open} onToggle={e=>{if(e.currentTarget.open!==open)onOpenChange?.(e.currentTarget.open);}}><summary onClick={e=>{if(onOpenChange){e.preventDefault();onOpenChange(!open);}}}>{section.title}</summary>{body}</details>:<section className="p-glass p-section event-section"><h2>{section.title}</h2>{body}</section>;
}


