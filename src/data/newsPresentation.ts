import type {LiveNewsItem} from './newsFeedTypes';
import {isPublishableNews,isPublishableSummary,isPublishableSource} from './newsAdmission';
export function newsDateInBeijing(value:string):string{
 const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');
}
export function presentNews(item:LiveNewsItem):{kind:'summary'|'analysis'|'source';title:string;summary:string;publishedAt:string}|undefined{
 if(item.factualSummary?.language==='zh'&&isPublishableSummary(item)&&item.editorial?.language==='en')return {kind:'summary',title:item.factualSummary.title,summary:item.factualSummary.summary,publishedAt:item.publishedAt};
 if(isPublishableNews(item))return {kind:'analysis',title:item.editorial!.item.title,summary:item.editorial!.item.summary,publishedAt:item.publishedAt};
 if(isPublishableSummary(item))return {kind:'summary',title:item.factualSummary?.title??item.originalTitle,summary:item.factualSummary?.summary??item.originalSummary!,publishedAt:item.publishedAt};
 if(isPublishableSource(item))return {kind:'source',title:item.originalTitle,summary:'已核对来源。中文摘要整理中，请查看来源原文。',publishedAt:item.publishedAt};
 return undefined;
}

export function chineseStatus(item:LiveNewsItem):string {
 if(item.originalLanguage!=='en')return '';
 if(item.factualSummary?.language==='zh'&&isPublishableSummary(item))return '中文整理已核验';
 if(isPublishableNews(item)&&item.editorial?.language!=='en')return '中文解读已核验';
 return ({failed:'中文整理失败，保留已核验来源',rejected:'中文整理未通过核验，保留原文',unavailable:'中文整理暂不可用，保留原文',pending:'中文整理待处理，保留原文'} as Record<string,string>)[item.chineseSummary?.status??'pending']??'中文整理待处理，保留原文';
}
