import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('Today page', () => {
  beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({schemaVersion:1,attemptedAt:'2026-09-14T10:17:00Z',lastSuccessfulAt:'2026-09-14T10:17:00Z',nextExpectedAt:'2026-09-14T11:17:00Z',status:'fresh',latest:[{id:'live-cpi',originalTitle:'China CPI',titleZh:'中国居民消费价格公布',summaryZh:'物价变化影响通胀预期。',sourceName:'国家统计局',publishedAt:'2026-09-14T10:00:00Z',analysisLevels:['宏观'],eventTypes:['经济数据'],impactChannels:['通胀'],regions:['中国'],translationStatus:'generated'}],continuing:[{id:'old-policy',originalTitle:'Policy',titleZh:'政策仍在传导',summaryZh:'市场继续评估影响。',sourceName:'Federal Reserve',publishedAt:'2026-09-12T10:00:00Z',analysisLevels:['宏观'],eventTypes:['货币政策'],impactChannels:['利率'],regions:['全球'],translationStatus:'generated'}],retainedDetails:[],sourceHealth:[]})})));
  afterEach(()=>vi.unstubAllGlobals());
  it('opens with an A-share market dashboard and sector explanations', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    const page = container.querySelector<HTMLElement>('.today-page')!;
    const copy = page.textContent ?? '';
    for (const expected of ['数据截至 2026-09-11','A股市场全景','行业相对强弱','政策与地缘传导','为什么这样走','元件 / MLCC']) {
      expect(copy).toContain(expected);
    }
    const buttons = [...page.querySelectorAll('button')].map(button => button.textContent?.trim());
    for (const label of ['港股','美股','全球资产']) expect(buttons).toContain(label);
    expect(copy.match(/受影响板块/g)).toHaveLength(3);
  });

  it('filters stories from the search control', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect(await screen.findByText('中国居民消费价格公布')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: '搜索资讯' }), '物价');
    expect(screen.getByText('中国居民消费价格公布')).toBeInTheDocument();
  });

  it('shows live and continuing news separately with update status',async()=>{render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);expect(await screen.findByRole('heading',{name:'正在发生'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'持续影响'})).toBeInTheDocument();expect(screen.getByText(/最近成功更新/)).toBeInTheDocument();expect(screen.getByText('政策仍在传导')).toBeInTheDocument();});

  it('exposes the dashboard navigation and sector comparison without hover', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect(screen.getByRole('navigation', { name: '桌面主要导航' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '行业涨跌比较' })).toBeInTheDocument();
    expect(screen.getByText('板块表现一览')).toBeInTheDocument();
    expect(screen.getAllByText('领涨').length).toBeGreaterThan(0);
    expect(screen.getAllByText('领跌').length).toBeGreaterThan(0);
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

  it('keeps market direction explicit and makes mobile transmission steps expandable', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    const marketCards = [...container.querySelectorAll('.market-card')];

    expect(marketCards.length).toBeGreaterThan(0);
    for (const card of marketCards) {
      expect(card.querySelector('.market-change')?.textContent).toMatch(/[↑↓].*(上涨|下跌)/);
    }

    const chain = screen.getByRole('list', { name: '宏观传导路径' });
    expect(chain).toHaveClass('impact-chain');
    expect(within(chain).getAllByRole('button')).toHaveLength(5);
    expect(within(chain).getByRole('button', { name: /油价上涨/ })).toHaveAttribute('aria-expanded');
  });
});
