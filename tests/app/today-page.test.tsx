import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { webcrypto } from 'node:crypto';
import { reviewedFetch,reviewedItem } from '../fixtures/reviewedFeed';

describe('Today page', () => {
  beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({schemaVersion:1,attemptedAt:'2026-09-14T10:17:00Z',lastSuccessfulAt:'2026-09-14T10:17:00Z',nextExpectedAt:'2026-09-14T11:17:00Z',status:'fresh',latest:[{id:'live-cpi',originalTitle:'China CPI',titleZh:'中国居民消费价格公布',summaryZh:'物价变化影响通胀预期。',sourceName:'国家统计局',publishedAt:'2026-09-14T10:00:00Z',analysisLevels:['宏观'],eventTypes:['经济数据'],impactChannels:['通胀'],regions:['中国'],translationStatus:'generated'}],continuing:[{id:'old-policy',originalTitle:'Policy',titleZh:'政策仍在传导',summaryZh:'市场继续评估影响。',sourceName:'Federal Reserve',publishedAt:'2026-09-12T10:00:00Z',analysisLevels:['宏观'],eventTypes:['货币政策'],impactChannels:['利率'],regions:['全球'],translationStatus:'generated'}],retainedDetails:[],sourceHealth:[]})})));
  afterEach(()=>vi.unstubAllGlobals());
  it('opens with news and clear content entrances', () => {
    const {container}=render(<MemoryRouter><App/></MemoryRouter>);
    expect(screen.getByRole('heading',{name:'资讯'})).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('navigation',{name:'内容入口'})).toHaveTextContent('全球局势');
  });

  it('supports filtering on the news homepage', async () => {
    vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('fetch',reviewedFetch);
    const {container}=render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect((await screen.findAllByText(reviewedItem.titleZh!)).length).toBeGreaterThan(0);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(container.querySelector('.live-news-feed')).toBeInTheDocument();
  });

  it('keeps complete old reports explicitly dated and linked, not presented as current news',async()=>{
    vi.stubGlobal('crypto',webcrypto);vi.stubGlobal('fetch',reviewedFetch);
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading',{name:'此前报道 / 背景参考'})).toBeInTheDocument();
    expect(screen.queryByRole('heading',{name:'正在发生'})).not.toBeInTheDocument();
    expect(screen.getByRole('link',{name:reviewedItem.editorial!.item.title})).toHaveAttribute('href',`/news/${reviewedItem.id}`);
    expect(screen.getByText(/新闻发布：/)).toBeInTheDocument();
    expect(screen.getByText(reviewedItem.editorial!.item.summary)).toBeInTheDocument();
  });

  it('exposes both desktop and mobile navigation without market panels', () => {
    render(<MemoryRouter><App/></MemoryRouter>);
    expect(screen.getByRole('navigation',{name:'桌面主要导航'})).toHaveTextContent('金融知识库');
    expect(screen.getByRole('navigation',{name:'主要导航'})).toHaveTextContent('资讯');
    expect(screen.queryByRole('region',{name:'行业相对强弱'})).toBeNull();
  });

  it('uses the Financial Lens brand and beginner-friendly message', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect(screen.getAllByText('金融透镜').length).toBeGreaterThan(0);
    expect(screen.getByText('穿过噪音，看清市场')).toBeInTheDocument();
    expect(screen.getByText('每天看懂一点世界和市场')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: '金融透镜标志' }).length).toBeGreaterThan(0);
  });

  it('renders a dedicated aurora backdrop behind the glass dashboard', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    const backdrop = container.querySelector('.site-backdrop');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    expect(backdrop?.getAttribute('style')).toContain('./aurora-blue-purple-bg.png');
    expect(screen.getAllByRole('img', { name: '金融透镜标志' })[0]).toHaveAttribute(
      'src',
      './financial-lens-logo.png',
    );
  });

  it('does not render an unsupported causal chain', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(container.querySelector('.impact-chain')).not.toBeInTheDocument();
    expect(screen.queryByText('核心市场传导')).not.toBeInTheDocument();
  });
});
