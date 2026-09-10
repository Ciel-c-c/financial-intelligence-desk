import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Today page', () => {
  it('opens with an A-share market dashboard and sector explanations', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect(screen.getAllByText('演示').length).toBeGreaterThan(0);
    expect(screen.getByText(/数据截至 2026-09-09/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '今日要闻' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '股市新闻' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '经济新闻' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A股市场全景' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '港股' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '美股' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '全球资产' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '行业板块涨跌' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '政策与地缘影响' })).toBeInTheDocument();
    expect(screen.getAllByText('受影响板块')).toHaveLength(2);
    expect(screen.getAllByText('为什么这样走').length).toBeGreaterThan(0);
    expect(screen.getByText('煤炭开采')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /芯片公司业绩增长/ })).toHaveAttribute('href', '/news/nvidia-results');
  });

  it('filters stories from the search control', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    await user.type(screen.getByRole('searchbox', { name: '搜索资讯' }), '物价');
    expect(screen.getByText(/物价数据温和/)).toBeInTheDocument();
    expect(screen.queryByText(/芯片公司业绩增长/)).not.toBeInTheDocument();
  });

  it('exposes the dashboard navigation and sector comparison without hover', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);

    expect(screen.getByRole('navigation', { name: '桌面主要导航' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '行业涨跌比较' })).toBeInTheDocument();
    expect(screen.getByText('板块表现一览')).toBeInTheDocument();
    expect(screen.getAllByText('+3.35%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-3.46%').length).toBeGreaterThan(0);
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
  });
});
