import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { NewsFeedSections } from '../../src/components/NewsFeedSections';
import { LiveNewsDetail } from '../../src/components/LiveNewsDetail';
import { newsFeedSeed } from '../../src/data/newsFeedSeed';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';
import reviewed from '../fixtures/reviewed-news.json';
import { isPublishableNews } from '../../src/data/newsAdmission';
import { LiveNewsCard } from '../../src/components/LiveNewsCard';
import { selectBriefNews } from '../../scripts/update-site-data.mjs';

function englishStory():LiveNewsItem {
 const story=structuredClone(reviewed.items[0]) as unknown as LiveNewsItem;
 Object.assign(story,{titleZh:undefined,summaryZh:undefined,titleEn:'Rates and borrowing costs',summaryEn:'Lower rates may reduce financing costs.',translationStatus:'unavailable'});
 const editorial=story.editorial!;
 Object.assign(editorial,{language:'en'});
 Object.assign(editorial.item,{title:'Rates and borrowing costs',summary:'Lower rates may reduce financing costs.',excerpt:'The mechanism depends on lending conditions.',facts:['The source reports a rate change.'],consensus:['Financing costs may change.'],inference:['Investment may respond if demand holds.'],risks:['Weak demand may offset lower rates.'],causalChain:[{title:'Rates change',explanation:'The policy rate affects funding.',condition:'Transmission works.'},{title:'Funding changes',explanation:'Lenders may adjust prices.',condition:'Credit is available.'},{title:'Investment responds',explanation:'Businesses may borrow.',condition:'Demand holds.'}]});
 editorial.watchItems=['Watch lending conditions.'];
 editorial.soWhat=undefined;
 return story;
}
it('admits reviewed English analysis without a Chinese translation',()=>{
 expect(isPublishableNews(englishStory())).toBe(true);
});
it('selects a current English editorial for the generated brief',()=>{
 const story=englishStory();
 expect(selectBriefNews({latest:[story]},story.publishedAt).map((item:LiveNewsItem)=>item.id)).toEqual([story.id]);
});
it('shows the reviewed English title and summary rather than the raw feed',()=>{
 render(<MemoryRouter><LiveNewsCard item={englishStory()}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Rates and borrowing costs'})).toBeInTheDocument();
 expect(screen.getByText('Lower rates may reduce financing costs.')).toBeInTheDocument();
});
it('labels English analysis and never substitutes Chinese generic SoWhat',()=>{
 render(<MemoryRouter><LiveNewsDetail item={englishStory()}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Rates and borrowing costs'})).toBeInTheDocument();
 expect(screen.getByText('完整正文已读取 · 英文解读 · 尚未翻译')).toBeInTheDocument();
 expect(screen.queryByRole('heading',{name:'所以呢？'})).not.toBeInTheDocument();
});
it('rejects incomplete or title-mismatched English editorials',()=>{
 const missing=englishStory();missing.editorial!.item.risks=[];
 expect(isPublishableNews(missing)).toBe(false);
 const mismatch=englishStory();Object.assign(mismatch,{titleEn:'Another event'});
 expect(isPublishableNews(mismatch)).toBe(false);
});

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
