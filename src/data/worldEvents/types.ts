export type ClaimKind = 'fact'|'mechanism'|'scenario'|'uncertain'|'illustration'|'market-observation';
export type EvidenceState = 'active'|'changed'|'withdrawn'|'unavailable';
export interface EventEvidence { id:string;title:string;url:string;publisher:string;publishedAt:string|null;knownAt:string|null;retrievedAt:string;state:EvidenceState;captureState:'manual-reference';bodySha256:string|null }
export interface EvidenceRef {evidenceId:string;relation:'supports'|'context'|'contradicts';locator:string}
export interface EventClaim {id:string;kind:ClaimKind;text:string;scope:string;evidenceRefs:EvidenceRef[];conditions:string[];invalidators:string[];unknowns:string[];reviewState:'curated'|'needs-review'|'rejected';basis:'source-reported'|'research-finding'|'editor-synthesis'|'illustration'}
export interface EventNode {id:string;title:string;claimIds:string[];conceptIds:string[]}
export interface EventEdge {id:string;from:string;to:string;explanationClaimId:string;conditions:string[];invalidators:string[];lag:string|null}
export interface EventBranch {id:string;label:string;question:string;intro:string;boundary:string;nodeIds:string[]}
export interface EventConcept {id:string;title:string;explanation:string;example:string;lessonIds:string[]}
export interface EventNewsLink {canonicalUrl:string;evidenceId:string;relation:'same-event'|'topic-context'|'historical-case';rationale:string;expectedSourceHash:string|null;reviewedAt:string}
export interface EventQuestion {prompt:string;options:{id:string;text:string}[];correctId:string;explanation:string;revisitNodeId?:string}
export interface WorldEvent {
 schemaVersion:1;id:string;question:string;domain:string[];value:string;summary:string;
 period:{start:string;end:string;label:string};historical:true;experience:'interactive'|'basic';curatedAt:string;
 evidence:EventEvidence[];claims:EventClaim[];sections:{id:string;title:string;claimIds:string[];collapsed:boolean}[];
 timeline:{id:string;label:string;occurredAt:string;precision:'year'|'month'|'day';knownAt:string|null;claimIds:string[];evidenceIds:string[]}[];
 nodes:EventNode[];edges:EventEdge[];branches:EventBranch[];concepts:EventConcept[];lessonIds:string[];
 impacts:{scope:'macro'|'industry'|'company'|'asset';subjects:string[];claimIds:string[]}[];
 newsLinks:EventNewsLink[];quiz:EventQuestion;
 marketCoverage:{status:'not-verified'|'limited-observation';reason:string};
 revisions:{version:number;revisedAt:string;reason:string}[];
}

