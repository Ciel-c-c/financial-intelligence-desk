import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';

describe('News detail', () => {
  it('separates evidence and uncertainty in plain language', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/news/nvidia-results']}><App /></MemoryRouter>);

    expect(screen.getByRole('link', { name: '查看原始来源' })).toHaveAttribute('href', 'https://investor.nvidia.com/');
    for (const label of ['事实', '主流市场解释 · 机制参考', 'AI 推演', '风险与反例']) expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    expect(screen.getByText('资本开支预算真正落地。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /业绩指引/ }));
    expect(screen.getByRole('heading', { name: '专业定义' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '大白话' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '为什么市场在意？' })).toBeInTheDocument();
    expect(screen.getByText(/公司管理层对未来/)).toBeInTheDocument();
  });

  it('progressively reveals the deeper So What analysis', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/news/nvidia-results']}><App /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: '所以呢？' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '像什么？' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '接下来可能' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '表面新闻 vs 真正重点' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '市场在赌什么？' })).not.toBeInTheDocument();
    expect(screen.getByText('别只看发生了什么，要看这件事改变了什么。')).toBeInTheDocument();

    const reveal = screen.getByRole('button', { name: /继续看懂/ });
    expect(reveal).toHaveAttribute('aria-expanded', 'false');
    await user.click(reveal);

    expect(reveal).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: '为什么？' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '市场在赌什么？' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '换个方向看' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '跟我有什么关系？' })).toBeInTheDocument();
    expect(screen.getByText(/新闻与原先预期之间的差异/)).toBeInTheDocument();
  });

  it('shows a useful missing-story state', async () => {
    render(<MemoryRouter initialEntries={['/news/missing']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: '没有找到这条资讯' })).toBeInTheDocument();
  });
  it('renders a verified live story without inventing unavailable analysis',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({schemaVersion:1,attemptedAt:'2026-09-14T10:17:00Z',lastSuccessfulAt:'2026-09-14T10:17:00Z',nextExpectedAt:'2026-09-14T11:17:00Z',status:'fresh',latest:[{id:'live-1',canonicalUrl:'https://www.stats.gov.cn/a',sourceUrl:'https://www.stats.gov.cn/a',sourceName:'国家统计局',sourceTier:'official',verificationStatus:'official',publishedAt:'2026-09-14T10:00:00Z',fetchedAt:'2026-09-14T10:17:00Z',originalLanguage:'zh',originalTitle:'居民消费价格公布',titleZh:'居民消费价格公布',summaryZh:'CPI 变化影响通胀预期。',translationStatus:'original-zh',analysisLevels:['宏观'],eventTypes:['经济数据'],impactChannels:['通胀'],regions:['中国'],keyTerms:['CPI'],causalSignals:['通胀→利率预期'],importanceScore:70,continuingImpactScore:40,clusterId:'c',relatedSources:[],detailStatus:'professional',facts:['CPI 已公布。'],expectations:['市场关注后续通胀。'],inferences:[]}],continuing:[],retainedDetails:[],sourceHealth:[]})}));render(<MemoryRouter initialEntries={['/news/live-1']}><App /></MemoryRouter>);expect(await screen.findByRole('heading',{name:'居民消费价格公布'})).toBeInTheDocument();expect(screen.getByText('官方原始发布')).toBeInTheDocument();expect(screen.getByRole('link',{name:'查看原始来源'})).toHaveAttribute('href','https://www.stats.gov.cn/a');expect(screen.getByRole('heading',{name:'所以呢？'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'专业解读 · 机制参考'})).toBeInTheDocument();expect(screen.getByText(/不代表已核验全文/)).toBeInTheDocument();vi.unstubAllGlobals();});
});
