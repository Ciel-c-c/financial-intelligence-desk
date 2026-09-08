import { describe, expect, it } from 'vitest';
import { brief, news } from '../../src/data/demoData';
import { filterNews, getNewsById, validateBriefReferences } from '../../src/data/selectors';

describe('news selectors', () => {
  it('filters by region and a case-insensitive query', () => {
    expect(filterNews(news, 'NVidia', '美股').map((item) => item.id)).toEqual(['nvidia-results']);
  });

  it('returns all regions when the region is 全部', () => {
    expect(filterNews(news, '', '全部')).toHaveLength(news.length);
  });

  it('returns undefined for an unknown story', () => {
    expect(getNewsById('missing')).toBeUndefined();
  });

  it('keeps every brief story reference resolvable', () => {
    expect(validateBriefReferences(brief, news)).toEqual([]);
  });
});
