import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/app/App';

function open(path = '/learn') { return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>); }
beforeEach(() => localStorage.clear());
describe('self-directed learning', () => {
  it('shows the complete map and lets search and level filters intersect', () => {
    const { container } = open();
    const map = container.querySelector<HTMLElement>('.knowledge-map')!;
    expect(map).toHaveTextContent('全部知识地图');
    expect(map).toHaveTextContent('机会成本与边际决策');
    expect(map).toHaveTextContent('杠杆与流动性风险');
    fireEvent.change(map.querySelector('input[type="search"]')!, { target:{ value:' CPI ' } });
    expect(map).toHaveTextContent('通胀与实际购买力');
    expect(map).not.toHaveTextContent('机会成本与边际决策');
    fireEvent.change(map.querySelectorAll('select')[1], { target:{ value:'4' } });
    expect(map).toHaveTextContent('没有匹配的知识点');
    fireEvent.click(map.querySelector<HTMLButtonElement>('.section-heading button')!);
    expect(map).toHaveTextContent('机会成本与边际决策');
  });
  it('opens a lesson directly, answers a quiz and persists completion', async () => {
    const user = userEvent.setup(); const view = open('/learn/interest-rate');
    expect(screen.getByRole('heading', { name: '利率与货币政策传导' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '哪些变量会改变结论' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看答案' }));
    expect(screen.getByText(/盈利下调可能抵消/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '标记已学会' }));
    view.unmount(); open('/learn/interest-rate');
    expect(screen.getByRole('checkbox', { name: '标记已学会' })).toBeChecked();
  });
  it('survives malformed saved progress and unknown lesson links', () => {
    localStorage.setItem('fid-learned-terms', '{"bad":true}');
    const view = open(); expect(screen.getByRole('heading', { name: '全部知识地图' })).toBeInTheDocument();
    view.unmount(); open('/learn/missing');
    expect(screen.getByText('未找到这个知识点')).toBeInTheDocument();
  });
  it('keeps snapshot provenance and analysis labels visible', () => {
    open(); expect(screen.getByText(/未接入实时抓取/)).toBeInTheDocument();
    expect(screen.getAllByText('事实 · 原快照记录').length).toBeGreaterThan(0);
    expect(screen.getAllByText('主流市场解释 · 机制参考，非共识调查').length).toBeGreaterThan(0);
    expect(screen.getAllByText('推演 · 有条件，非预测').length).toBeGreaterThan(0);
  });
});
