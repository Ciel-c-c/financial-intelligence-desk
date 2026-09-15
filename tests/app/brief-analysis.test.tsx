import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { BriefStoryCard } from '../../src/components/BriefStoryCard';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';
it('puts a mechanism and its limits alongside a clickable brief story',()=>{
 const story={id:'shipping',title:'航运路线受扰',publishedAt:'2026-09-15T01:00:00Z',sourceName:'BBC',sourceUrl:'https://bbc.com/a'};
 const item={...story,originalTitle:'Shipping disruption',summaryZh:'运输路线发生变化。',facts:['运输路线发生变化。'],eventTypes:[],regions:['全球'],keyTerms:[],impactChannels:[]} as unknown as LiveNewsItem;
 render(<MemoryRouter><BriefStoryCard story={story} item={item} index={0}/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/航运路线受扰/})).toHaveAttribute('href','/news/shipping');
 expect(screen.getByText('机制参考：')).toBeInTheDocument();
 expect(screen.getByText('真正重点：')).toBeInTheDocument();
 expect(screen.getByText(/合同锁定运价/)).toBeInTheDocument();
});
