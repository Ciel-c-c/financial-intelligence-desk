import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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

  it('shows a useful missing-story state', () => {
    render(<MemoryRouter initialEntries={['/news/missing']}><App /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: '没有找到这条资讯' })).toBeInTheDocument();
  });
});
