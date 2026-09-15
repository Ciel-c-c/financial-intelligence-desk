import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { webcrypto } from 'node:crypto';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { App } from '../../src/app/App';
import { reviewedFetch,reviewedItem } from '../fixtures/reviewedFeed';
describe('verified complete news detail',()=>{
 beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('fetch',vi.fn(reviewedFetch));});
 afterEach(()=>vi.unstubAllGlobals());
 it('preserves the previous professional analysis and terminology layout',async()=>{
  const user=userEvent.setup();
  render(<MemoryRouter initialEntries={['/news/ecb-energy-rate-hike']}><App/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:reviewedItem.titleZh})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'查看原始来源'})).toHaveAttribute('href','https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260910~314e508016.en.html');
  for(const name of ['事实','主流市场解释 · 机制参考','AI 推演','风险与反例']) expect(screen.getByRole('heading',{name})).toBeInTheDocument();
  expect(screen.getByText(/分别为2.50%、2.65%和2.90%/)).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/CPI/}));
  for(const name of ['专业定义','大白话','为什么市场在意？']) expect(screen.getByRole('heading',{name})).toBeInTheDocument();
 });
 it('progressively reveals expectation gaps and relevant non-stock dimensions',async()=>{
  const user=userEvent.setup();
  render(<MemoryRouter initialEntries={['/news/ecb-energy-rate-hike']}><App/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'所以呢？'})).toBeInTheDocument();
  expect(screen.queryByRole('heading',{name:'市场在赌什么？'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:/继续看懂/}));
  for(const name of ['为什么？','市场在赌什么？','换个方向看','跟我有什么关系？','汇率','住房','企业经营']) expect(screen.getByRole('heading',{name})).toBeInTheDocument();
  expect(screen.getByText(/尚无可核验的事前一致预期/)).toBeInTheDocument();
 });
 it('does not revive an old unverified demo by its previous URL',async()=>{
  render(<MemoryRouter initialEntries={['/news/wall-street-oil-pressure']}><App/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'没有找到这条资讯'})).toBeInTheDocument();
  expect(screen.queryByRole('heading',{name:'所以呢？'})).not.toBeInTheDocument();
 });
 it('shows a useful missing-story state',async()=>{
  render(<MemoryRouter initialEntries={['/news/missing']}><App/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'没有找到这条资讯'})).toBeInTheDocument();
 });
});
