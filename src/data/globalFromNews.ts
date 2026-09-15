import type { LiveNewsItem } from './newsFeedTypes';
import type { GlobalEvent } from './globalSituationTypes';
import { isPublishableNews } from './newsAdmission';
export function globalEventFromNews(news:LiveNewsItem):GlobalEvent|undefined{
 if(!isPublishableNews(news)||!news.editorial!.political) return undefined;
 const {item,political,watchItems,soWhat}=news.editorial!;
 const criteria=news.impactChannels.map(channel=>({'通胀':'inflation','利率':'centralBank','汇率':'capitalFlows','盈利':'earnings','供需':'supplyChain','估值':'riskAppetite','就业':'growth'})[channel]);
 const score=new Set(criteria).size;const level=score>=6?'high':score>=3?'medium':'low';
 const nodes=item.causalChain.map((step,index)=>({id:`${news.id}-${index}`,title:step.title,beginnerExplanation:step.explanation,condition:step.condition,uncertain:/可能/.test(step.title)}));
 return {id:news.id,headline:item.title,sourceHeadline:news.originalTitle,oneLine:item.summary,oneSentenceExplanation:item.summary,summary:item.summary,publishedAt:news.publishedAt,firstPublishedAt:news.publishedAt,latestSourceAt:news.publishedAt,fetchedAt:news.article!.checkedAt,region:news.regions.includes('欧洲')?'europe':news.regions.includes('中国')?'china':news.regions.includes('美国')?'united-states':'global',topic:item.topic,eventType:news.eventTypes.includes('地缘风险')?'geopolitical-conflict':news.eventTypes.includes('货币政策')?'monetary-policy':news.eventTypes.includes('贸易')?'trade-policy':'economic-policy',relevance:{level,score,criteria},marketRelevance:level,marketRelevanceScore:score,relevanceReasons:criteria,fact:item.facts,factSummary:item.facts.join(' '),marketView:item.consensus,scenarios:item.inference,simpleExample:soWhat?.analogy.explanation??item.summary,professionalConcept:item.consensus.join(' '),causalChain:nodes,impactChain:nodes,relatedAssets:political!.affected.map(name=>({name,explanation:political!.channel})),relatedIndustries:political!.affected,knowledgeIds:item.termIds,relatedKnowledgePoints:item.termIds,conditionsThatChangeView:item.risks,watchConditions:watchItems,marketReaction:[],sources:[{name:item.sourceName,url:item.sourceUrl,publishedAt:item.publishedAt}]};
}
