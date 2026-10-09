import type {LiveNewsItem} from './newsFeedTypes';
import {isPublishableNews,isPublishableSummary} from './newsAdmission';
export function newsDateInBeijing(value:string):string{
 const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');
}
export function presentNews(item:LiveNewsItem):{kind:'summary'|'analysis';title:string;summary:string;publishedAt:string}|undefined{
 if(isPublishableNews(item))return {kind:'analysis',title:item.editorial!.item.title,summary:item.editorial!.item.summary,publishedAt:item.publishedAt};
 if(isPublishableSummary(item))return {kind:'summary',title:item.factualSummary?.title??item.originalTitle,summary:item.factualSummary?.summary??item.originalSummary!,publishedAt:item.publishedAt};
 return undefined;
}
