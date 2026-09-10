import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Brief and learning', () => {
  it('links dated brief events to their explanations', () => {
    render(<MemoryRouter initialEntries={['/brief']}><App /></MemoryRouter>);
    expect(screen.getByText('2026-09-09')).toBeInTheDocument();
    expect(screen.getByText(/A股指数小涨但个股偏弱/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /油价逼近100美元/ })).toHaveAttribute('href', '/news/wall-street-oil-pressure');
  });

  it('searches, opens and marks an independent lesson learned', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/learn']}><App /></MemoryRouter>);
    await user.type(screen.getByRole('searchbox', { name: '搜索知识' }), 'CPI');
    const map = within(screen.getByRole('region', { name: '全部知识地图' }));
    expect(map.queryByRole('link', { name: /利率与货币政策/ })).not.toBeInTheDocument();
    await user.click(map.getByRole('link', { name: /通胀与实际购买力/ }));
    expect(screen.getByRole('heading', { name: '通胀与实际购买力' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '标记已学会' }));
    expect(screen.getByRole('checkbox', { name: '标记已学会' })).toBeChecked();
  });
});
