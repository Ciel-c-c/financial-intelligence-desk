import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Brief and learning', () => {
  it('links dated brief events to their explanations', () => {
    render(<MemoryRouter initialEntries={['/brief']}><App /></MemoryRouter>);
    expect(screen.getByText('2026-09-08')).toBeInTheDocument();
    expect(screen.getByText(/AI 投资、物价数据与利率预期/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /芯片公司业绩增长/ })).toHaveAttribute('href', '/news/nvidia-results');
  });

  it('searches, expands and marks a knowledge card learned', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/learn']}><App /></MemoryRouter>);
    await user.type(screen.getByRole('searchbox', { name: '搜索知识' }), 'CPI');
    expect(screen.getByRole('button', { name: /CPI/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /利率/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /CPI/ }));
    expect(screen.getByText(/一篮子常见商品/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '标记 CPI 已学会' }));
    expect(screen.getByText('已学会')).toBeInTheDocument();
  });
});
