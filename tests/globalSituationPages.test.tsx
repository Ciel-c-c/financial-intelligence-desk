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
    expect(screen.getByRole('heading', { name:'今天最重要的一件事' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'市场正在交易什么' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'接下来关注什么' })).toBeInTheDocument();
    expect(await screen.findByText('数据源异常')).toBeInTheDocument();
  });

  it('filters the map through keyboard-accessible region controls', async () => {
    const user = userEvent.setup();
    open('/situation');
    const map = screen.getByRole('region', { name:'全球金融风险地图' });
    await user.click(within(map).getByRole('button', { name:/欧洲/ }));
    expect(within(map).getByText(/欧洲央行提高政策利率/)).toBeInTheDocument();
    expect(within(map).queryByText(/中国出口增长/)).not.toBeInTheDocument();
  });

  it('strictly separates fact, market view and scenario on event details', async () => {
    const user = userEvent.setup();
    open('/situation/middle-east-energy-risk');
    expect(screen.getByText('FACT｜事实')).toBeInTheDocument();
    expect(screen.getByText('MARKET VIEW｜市场解释')).toBeInTheDocument();
    expect(screen.getByText('SCENARIO｜情景推演')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'举个简单例子' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name:'影响链' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name:/航空股/ }));
    expect(screen.getByText(/燃油是重要成本/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name:/原油价格可能上涨/ }));
    expect(screen.getByText(/愿意付更高价格/)).toBeInTheDocument();
    expect(screen.getByText(/S&P 500/)).toBeInTheDocument();
    expect(screen.getAllByText(/数据时间/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name:/通胀与实际购买力/ })).toHaveAttribute('href','/learn/cpi');
  });

  it('shows an honest empty state when an event has no reliable reaction data', () => {
    open('/situation/ecb-energy-rate-decision');
    expect(screen.getByText('暂无可靠市场价格数据')).toBeInTheDocument();
  });

  it('links an academy lesson back to recent global situation cases', () => {
    open('/learn/cpi');
    expect(screen.getByRole('heading', { name:'最近全球局势案例' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name:/中东冲突继续影响能源运输/ })).toHaveAttribute('href','/situation/middle-east-energy-risk');
  });
});
