import { news, dataTimestamp } from './demoData';
import { findLesson } from './curriculum';
import type { NewsItem } from './types';
export { dataTimestamp as learningNewsUpdatedAt };
const eventLinks: Record<string, string[]> = {
  'wall-street-oil-pressure': ['geopolitics','supply-demand','cpi','interest-rate','industry-cycle'],
  'china-exports-august': ['trade','exchange-rate','elasticity','sampling','gdp'],
  'new-york-fed-expectations': ['cpi','interest-rate','sampling','expectations'],
  'asia-oil-bonds': ['geopolitics','bonds','exchange-rate','valuation'],
};
const rules: { pattern: RegExp; ids: string[] }[] = [
  { pattern: /战争|冲突|制裁|能源|油价/, ids: ['geopolitics','supply-demand','cpi'] },
  { pattern: /关税|出口|贸易/, ids: ['trade','elasticity','exchange-rate'] },
  { pattern: /选举|议会|候选人/, ids: ['elections','expectations'] },
  { pattern: /央行|联储|利率|降息|加息/, ids: ['interest-rate','bonds'] },
  { pattern: /财政|刺激|减税|预算/, ids: ['fiscal-multiplier','public-debt'] },
  { pattern: /汇率|人民币|美元/, ids: ['exchange-rate'] },
];
export function knowledgeForEvent(item: NewsItem) {
  const text = `${item.topic} ${item.title} ${item.summary}`;
  const ids = [...(eventLinks[item.id] ?? []), ...rules.filter(rule => rule.pattern.test(text)).flatMap(rule => rule.ids), ...item.termIds];
  return [...new Set(ids)].flatMap(id => { const lesson = findLesson(id); return lesson ? [lesson] : []; });
}
export function selectLearningEvents(items: NewsItem[]) {
  return items.filter(item => item.mode !== '演示' && (eventLinks[item.id] || rules.some(rule => rule.pattern.test(`${item.topic} ${item.title} ${item.summary}`))))
    .sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
}
export const learningEvents = selectLearningEvents(news);
