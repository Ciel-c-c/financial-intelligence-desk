import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Today page', () => {
  it('opens with an A-share market dashboard and sector explanations', () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    const page = container.querySelector<HTMLElement>('.today-page')!;
    const copy = page.textContent ?? '';
    for (const expected of ['演示','数据截至 2026-09-11','核心事件','市场与公司动态','宏观经济动态','A股市场全景','行业相对强弱','政策与地缘传导','为什么这样走','元件 / MLCC']) {
      expect(copy).toContain(expected);
    }
    const buttons = [...page.querySelectorAll('button')].map(button => button.textContent?.trim());
    for (const label of ['港股','美股','全球资产']) expect(buttons).toContain(label);
    expect(copy.match(/受影响板块/g)).toHaveLength(3);
    expect(page.querySelector('a[href="/news/nvidia-results"]')).toHaveTextContent('芯片公司业绩增长');
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
});
