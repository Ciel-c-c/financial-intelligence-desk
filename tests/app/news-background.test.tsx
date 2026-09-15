import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect,it } from 'vitest';
import { NewsFeedSections } from '../../src/components/NewsFeedSections';
import { reviewedSnapshot } from '../fixtures/reviewedFeed';
it('keeps only complete dated stories as background, not today highlights',()=>{
 render(<MemoryRouter><NewsFeedSections snapshot={reviewedSnapshot} loading={false}/></MemoryRouter>);
 expect(screen.queryByRole('heading',{name:'正在发生'})).not.toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'此前报道 / 背景参考'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/欧洲央行加息/})).toBeInTheDocument();
 expect(screen.getByText(/发表于 24 小时以前/)).toBeInTheDocument();
});
