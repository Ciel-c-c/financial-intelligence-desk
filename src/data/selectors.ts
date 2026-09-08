import { brief, news } from './demoData';
import type { Brief, NewsItem, Region } from './types';

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
