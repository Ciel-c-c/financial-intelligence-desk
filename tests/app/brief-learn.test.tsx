import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Brief and learning', () => {
  it('links dated brief events to their explanations', () => {
    render(<MemoryRouter initialEntries={['/brief']}><App /></MemoryRouter>);
    expect(screen.getByText('2026-09-09')).toBeInTheDocument();
    expect(screen.getByText(/油价接近100美元/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /油价逼近100美元/ })).toHaveAttribute('href', '/news/wall-street-oil-pressure');
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
