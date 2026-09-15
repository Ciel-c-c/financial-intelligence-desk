import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect,it } from 'vitest';
import { BriefStoryCard } from '../../src/components/BriefStoryCard';
import { reviewedItem } from '../fixtures/reviewedFeed';
it('uses the earlier numbered clickable card for a complete reviewed story',()=>{
 const {container}=render(<MemoryRouter><BriefStoryCard index={0} item={reviewedItem} story={{id:reviewedItem.id,title:reviewedItem.titleZh!,publishedAt:reviewedItem.publishedAt,sourceName:reviewedItem.sourceName,sourceUrl:reviewedItem.canonicalUrl}}/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/欧洲央行加息/})).toHaveAttribute('href','/news/ecb-energy-rate-hike');
 expect(screen.getByText('01')).toBeInTheDocument();
 expect(screen.getByText(/新闻日期：2026-09-10/)).toBeInTheDocument();
 expect(container.querySelector('article')).not.toBeInTheDocument();
});
