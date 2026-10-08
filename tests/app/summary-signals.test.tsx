import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it} from 'vitest';
import {NewsArticle} from '../../src/components/NewsArticle';
import reviewed from '../fixtures/reviewed-news.json';
import type {NewsItem} from '../../src/data/types';
it('shows summary provenance and both conditions for a directional signal',()=>{
 render(<MemoryRouter><NewsArticle item={reviewed.items[0].editorial.item as NewsItem} evidenceScope="summary" signals={[{asset:'相关企业',direction:'下行',reason:'监管压力可能影响盈利。',condition:'监管措施实际执行。',invalidation:'若风险缓解，压力可能消退。',timeframe:'短期'}]}/></MemoryRouter>);
 expect(screen.getByText('基于来源摘要 · 中文解读')).toBeInTheDocument();
 expect(screen.getByText('成立条件：监管措施实际执行。')).toBeInTheDocument();
 expect(screen.getByText('什么情况下失效：若风险缓解，压力可能消退。')).toBeInTheDocument();
});
