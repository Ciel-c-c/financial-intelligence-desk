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
    for (const label of ['事实', '市场共识', 'AI 推演', '风险与反例']) expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    expect(screen.getByText('资本开支预算真正落地。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /业绩指引/ }));
    expect(screen.getByText(/公司管理层对未来/)).toBeInTheDocument();
  });

  it('shows a useful missing-story state', () => {
    render(<MemoryRouter initialEntries={['/news/missing']}><App /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: '没有找到这条资讯' })).toBeInTheDocument();
  });
});
