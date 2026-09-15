import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';
import { NewsFeedSections } from '../../src/components/NewsFeedSections';
import { newsFeedSeed } from '../../src/data/newsFeedSeed';

it('keeps dated stale snapshot stories as background, not today highlights', () => {
  const item = { id:'old-policy', canonicalUrl:'https://www.stats.gov.cn/a', sourceUrl:'https://www.stats.gov.cn/rss', sourceName:'国家统计局', sourceTier:'official' as const, verificationStatus:'official' as const, originalLanguage:'zh', originalTitle:'此前政策新闻', titleZh:'此前政策新闻', translationStatus:'original-zh' as const, publishedAt:'2020-01-01T12:00:00Z', fetchedAt:'2020-01-01T13:00:00Z', analysisLevels:['宏观' as const], eventTypes:['经济数据' as const], impactChannels:['供需' as const], regions:['中国' as const], keyTerms:[],causalSignals:[],importanceScore:70,continuingImpactScore:0,clusterId:'old-policy',relatedSources:[],detailStatus:'brief' as const,facts:[],expectations:[],inferences:[] };
  render(<MemoryRouter><NewsFeedSections loading={false} snapshot={{...newsFeedSeed,latest:[item],continuing:[],retainedDetails:[]}} /></MemoryRouter>);
  expect(screen.queryByRole('heading',{name:'正在发生'})).not.toBeInTheDocument();
  expect(screen.getByRole('heading',{name:'此前报道 / 背景参考'})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'此前政策新闻'})).toBeInTheDocument();
  expect(screen.getByText(/2020/)).toBeInTheDocument();
});
