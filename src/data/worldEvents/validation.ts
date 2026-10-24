import {findLesson} from '../curriculum';
import type {WorldEvent,EventClaim} from './types';
const validUrl=(value:string)=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function isClaimAvailable(event:WorldEvent,claim:EventClaim):boolean {
 if(claim.reviewState!=='curated')return false;
 if(claim.evidenceRefs.some(ref=>event.evidence.find(e=>e.id===ref.evidenceId)?.state!=='active'))return false;
 if((claim.kind==='fact'||claim.kind==='market-observation')&&!claim.evidenceRefs.some(r=>r.relation==='supports'))return false;
 return true;
}
export function validateWorldEvent(event:WorldEvent):string[] {
 const errors:string[]=[];
 if(event.schemaVersion!==1||!/^[-a-z0-9]+$/.test(event.id)||!event.historical)errors.push('invalid event header');
 if(!Number.isFinite(Date.parse(event.period.start))||!Number.isFinite(Date.parse(event.period.end))||event.period.start>event.period.end)errors.push('invalid period');
 const ids=<T extends {id:string}>(rows:T[],name:string)=>{const set=new Set(rows.map(r=>r.id));if(set.size!==rows.length)errors.push('duplicate '+name);return set;};
 const evidence=ids(event.evidence,'evidence'),claims=ids(event.claims,'claims'),nodes=ids(event.nodes,'nodes'),concepts=ids(event.concepts,'concepts');ids(event.edges,'edges');ids(event.branches,'branches');ids(event.sections,'sections');
 const refs=(values:string[],set:Set<string>)=>{if(values.some(id=>!set.has(id)))errors.push('invalid reference');};
 for(const e of event.evidence)if(!validUrl(e.url)||!['active','changed','withdrawn','unavailable'].includes(e.state))errors.push('invalid evidence');
 for(const c of event.claims){refs(c.evidenceRefs.map(r=>r.evidenceId),evidence);if(['fact','market-observation'].includes(c.kind)&&!c.evidenceRefs.some(r=>r.relation==='supports'))errors.push('fact missing evidence');if(['scenario','mechanism'].includes(c.kind)&&!c.conditions.length)errors.push('mechanism missing conditions');}
 for(const s of event.sections)refs(s.claimIds,claims);
 for(const n of event.nodes){refs(n.claimIds,claims);refs(n.conceptIds,concepts);}
 for(const b of event.branches){refs(b.nodeIds,nodes);for(let i=1;i<b.nodeIds.length;i++){if(!event.edges.some(e=>e.from===b.nodeIds[i-1]&&e.to===b.nodeIds[i]))errors.push("missing branch edge");}}
 for(const edge of event.edges){refs([edge.from,edge.to],nodes);refs([edge.explanationClaimId],claims);}
 for(const t of event.timeline){refs(t.claimIds,claims);refs(t.evidenceIds,evidence);if(!Number.isFinite(Date.parse(t.occurredAt)))errors.push('invalid timeline date');}
 for(const impact of event.impacts)refs(impact.claimIds,claims);
 for(const c of event.concepts)if(c.lessonIds.some(id=>!findLesson(id)))errors.push('invalid lesson reference');
 if(event.lessonIds.some(id=>!findLesson(id)))errors.push('invalid lesson reference');
 for(const link of event.newsLinks){refs([link.evidenceId],evidence);const e=event.evidence.find(e=>e.id===link.evidenceId);if(!validUrl(link.canonicalUrl)||e?.url!==link.canonicalUrl||!link.rationale.trim())errors.push('invalid news relationship');if(link.expectedSourceHash!==null&&!/^[a-f0-9]{64}$/.test(link.expectedSourceHash))errors.push('invalid source hash');}
 if(!event.quiz.options.some(o=>o.id===event.quiz.correctId)||new Set(event.quiz.options.map(o=>o.id)).size!==event.quiz.options.length)errors.push('invalid quiz');
 if(event.quiz.revisitNodeId)refs([event.quiz.revisitNodeId],nodes);
 const visited=new Set<string>(),active=new Set<string>();
 const walk=(id:string)=>{if(active.has(id)){errors.push('graph cycle');return;}if(visited.has(id))return;active.add(id);for(const e of event.edges.filter(e=>e.from===id))if(nodes.has(e.to))walk(e.to);active.delete(id);visited.add(id);};
 for(const id of nodes)walk(id);
 return [...new Set(errors)];
}

