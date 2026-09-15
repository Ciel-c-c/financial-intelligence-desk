import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';
import { BriefPage } from '../../src/pages/BriefPage';

vi.mock('../../src/data/useSiteData', () => ({ useSiteData: () => ({ loading:false, refresh:()=>{}, brief:{ schemaVersion:1, attemptedAt:'2026-09-15T03:00:00Z', lastSuccessfulAt:'2026-09-15T03:00:00Z', dataAsOf:'2026-09-15T02:00:00Z', nextExpectedAt:'2026-09-15T04:00:00Z', status:'fresh', freshness:'delayed', sourceHealth:[], edition:'morning', generatedAt:'2026-09-15T03:00:00Z', snapshotVersions:{news:'n1'}, facts:['8月数据今天发布'], stories:[{id:'today-data',title:'8月数据今天发布',publishedAt:'2026-09-15T02:00:00Z',sourceName:'国家统计局',sourceUrl:'https://www.stats.gov.cn/'}],watchItems:[],invalidationConditions:[] } }) }));

it('opens the current news detail from the restored brief card', () => {
  render(<MemoryRouter><BriefPage /></MemoryRouter>);
  expect(screen.getByRole('link',{name:/8月数据今天发布/})).toHaveAttribute('href','/news/today-data');
  expect(screen.getByText(/发布：2026/)).toBeInTheDocument();
  expect(screen.getByText('今天学一个')).toBeInTheDocument();
});
