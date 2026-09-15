import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { NewsFeedSections } from '../../src/components/NewsFeedSections';
import { LiveNewsDetail } from '../../src/components/LiveNewsDetail';
import { newsFeedSeed } from '../../src/data/newsFeedSeed';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';

const headlineOnly={id:'blocked',originalTitle:'Interest rate news without body',originalLanguage:'en',publishedAt:new Date().toISOString(),fetchedAt:new Date().toISOString(),sourceName:'ECB',sourceTier:'official',verificationStatus:'official',sourceUrl:'https://www.ecb.europa.eu/rss/press.html',canonicalUrl:'https://www.ecb.europa.eu/press/a',analysisLevels:['宏观'],eventTypes:['货币政策'],impactChannels:['利率'],regions:['欧洲'],facts:[],expectations:[],inferences:[],keyTerms:[],causalSignals:[],importanceScore:80,continuingImpactScore:0,clusterId:'blocked',relatedSources:[],detailStatus:'brief',translationStatus:'unavailable'} as LiveNewsItem;
it('does not publish headline-only stories on the news list',()=>{
 render(<MemoryRouter><NewsFeedSections snapshot={{...newsFeedSeed,latest:[headlineOnly]}} loading={false}/></MemoryRouter>);
 expect(screen.queryByRole('link',{name:'Interest rate news without body'})).not.toBeInTheDocument();
 expect(screen.getByText('24 小时新闻：0 条')).toBeInTheDocument();
});
it('does not substitute a generic explanation for unreadable full news',()=>{
 render(<MemoryRouter><LiveNewsDetail item={headlineOnly}/></MemoryRouter>);
 expect(screen.queryByRole('heading',{name:'Interest rate news without body'})).not.toBeInTheDocument();
 expect(screen.queryByRole('heading',{name:'所以呢？'})).not.toBeInTheDocument();
 expect(screen.getByText(/完整正文/)).toBeInTheDocument();
});
