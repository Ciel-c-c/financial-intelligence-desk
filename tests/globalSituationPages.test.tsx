import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/app/App';

function open(path: string) { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline fixture')));
});

describe('global situation learning loop', () => {
  it('adds professional primary navigation and a finance-first situation home', async () => {
    open('/situation');
    expect(screen.getAllByRole('link', { name:/全球局势/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name:/经济与市场学院/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name:'今天，全球有哪些事情正在影响你的钱？' })).toBeInTheDocument();
    expect(screen.getByText(/当前没有被规则判定/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'市场正在交易什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'接下来关注什么' })).toBeInTheDocument();
    expect(await screen.findByText('暂无数据')).toBeInTheDocument();
  });

  it('filters the map through keyboard-accessible region controls', async () => {
    const user = userEvent.setup();
    open('/situation');
    const map = screen.getByRole('region', { name:'全球金融风险地图' });
    await user.click(within(map).getByRole('button', { name:/欧洲/ }));
    expect(within(map).getByRole('button', { name:/欧洲/ })).toHaveAttribute('aria-pressed','true');
    expect(within(map).queryByText(/欧洲央行提高政策利率/)).not.toBeInTheDocument();
  });

  it('does not fall back to a seed event on event details', () => {
    open('/situation/middle-east-energy-risk');
    expect(screen.getByRole('heading', { name:'未找到这个事件' })).toBeInTheDocument();
    expect(screen.queryByText('FACT｜事实')).not.toBeInTheDocument();
  });

  it('shows an honest empty state when an event has no reliable reaction data', () => {
    open('/situation/ecb-energy-rate-decision');
    expect(screen.getByRole('heading', { name:'未找到这个事件' })).toBeInTheDocument();
  });

  it('does not inject seed cases into an academy lesson when live data is unavailable', async () => {
    open('/learn/cpi');
    expect(screen.getByRole('heading', { name:'最近全球局势案例' })).toBeInTheDocument();
    expect(await screen.findByText(/当前发布快照暂无直接案例/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name:/中东冲突继续影响能源运输/ })).not.toBeInTheDocument();
  });
});
