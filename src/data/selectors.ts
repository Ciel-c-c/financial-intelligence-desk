import { brief, news } from './demoData';
import type { Brief, NewsItem, Region } from './types';
import type { AnalysisLevel, EventType, LiveNewsItem, NewsFeedSnapshot, NewsRegion } from './newsFeedTypes';

export type RegionFilter = Region | '全部';

export function filterNews(items: NewsItem[], query: string, region: RegionFilter): NewsItem[] {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const matchesRegion = region === '全部' || item.region === region;
    const haystack = `${item.id} ${item.title} ${item.summary} ${item.topic} ${item.sourceName}`.toLocaleLowerCase();
    return matchesRegion && (!needle || haystack.includes(needle));
  });
}

export function getNewsById(id: string): NewsItem | undefined {
  return news.find((item) => item.id === id);
}

export function getTodayBrief(): Brief {
  return brief;
}

export function validateBriefReferences(item: Brief, items: NewsItem[]): string[] {
  const ids = new Set(items.map((newsItem) => newsItem.id));
  return item.newsIds.filter((id) => !ids.has(id));
}

export function findLiveNewsById(snapshot:NewsFeedSnapshot,id:string):LiveNewsItem|undefined{return [...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].find(item=>item.id===id);}
export interface LiveNewsFilters { query:string; region:NewsRegion|'全部'; level:AnalysisLevel|'全部'; eventType:EventType|'全部' }
export function filterLiveNews(items:LiveNewsItem[],filters:LiveNewsFilters){const needle=filters.query.trim().toLocaleLowerCase();return items.filter(item=>{const text=`${item.originalTitle} ${item.titleZh??''} ${item.originalSummary??''} ${item.summaryZh??''} ${item.sourceName} ${item.analysisLevels.join(' ')} ${item.eventTypes.join(' ')} ${item.impactChannels.join(' ')} ${item.regions.join(' ')}`.toLocaleLowerCase();return(!needle||text.includes(needle))&&(filters.region==='全部'||item.regions.includes(filters.region))&&(filters.level==='全部'||item.analysisLevels.includes(filters.level))&&(filters.eventType==='全部'||item.eventTypes.includes(filters.eventType));});}
