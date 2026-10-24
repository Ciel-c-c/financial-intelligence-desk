import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {WorldEventCards} from '../../src/components/WorldEventCards';
import {WorldEventPage} from '../../src/pages/WorldEventPage';
import {LessonPage} from '../../src/pages/LessonPage';
import {safeEventReturn} from '../../src/data/worldEvents/readingState';
vi.mock('../../src/data/useGlobalSituation',()=>({useGlobalSituation:()=>({events:[]})}));
beforeEach(()=>{vi.stubGlobal('scrollTo',vi.fn(()=>Promise.resolve()));Element.prototype.scrollIntoView=vi.fn();sessionStorage.clear();localStorage.clear();});
const open=(url='/events/el-nino-2023')=>render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/events/:id" element={<WorldEventPage/>}/><Route path="/learn/:id" element={<LessonPage/>}/></Routes></MemoryRouter>);
describe('world event reading',()=>{
 it('labels all five cards historical and four as basic rather than complete interactions',()=>{
  render(<MemoryRouter><WorldEventCards/></MemoryRouter>);
  expect(screen.getAllByRole('link')).toHaveLength(5);
  expect(screen.getAllByText('基础解读')).toHaveLength(4);
  expect(screen.getAllByText(/历史案例/)).toHaveLength(5);
 });
 it('preserves the last selected node for each branch and after course return',async()=>{
  open();const user=userEvent.setup();
  await user.click(screen.getByText('为什么海水会影响天气？',{exact:true}));
  await user.click(screen.getByRole('button',{name:'农业路径'}));
  await user.click(screen.getByRole('button',{name:/总供应还要算库存/}));
  await user.click(screen.getByRole('button',{name:'运输路径'}));
  await user.click(screen.getByRole('button',{name:/排队、少装或绕行/}));
  await user.click(screen.getByRole('button',{name:'农业路径'}));
  expect(screen.getByRole('button',{name:/总供应还要算库存/})).toHaveAttribute('aria-expanded','true');
  await user.click(screen.getByRole('button',{name:'展开概念：供给与价格'}));
  await user.click(screen.getByRole('link',{name:'学习课程：供需与均衡价格'}));
  expect(screen.getByRole('heading',{level:1,name:'供需与均衡价格'})).toBeVisible();
  await user.click(screen.getByRole('link',{name:'返回事件，继续探索'}));
  expect(screen.getByRole('button',{name:/总供应还要算库存/})).toHaveAttribute('aria-expanded','true');
  expect(screen.getByRole('button',{name:'收起概念：供给与价格'})).toHaveAttribute('aria-expanded','true');
  expect(screen.getByText(/平时信风把暖水/)).toBeVisible();
 });
 it('gives causal feedback for the scenario question',async()=>{
  open();await userEvent.click(screen.getByRole('radio',{name:/粮价和食品公司股价一定一起涨/}));
  await userEvent.click(screen.getByRole('button',{name:'看看我的推理'}));
  expect(screen.getByRole('status')).toHaveTextContent(/库存和其他产区丰收/);
 });
 it('rejects external/unknown return targets and tolerates unknown event ids',()=>{
  expect(safeEventReturn('/events/el-nino-2023?path=transport')).toBe('/events/el-nino-2023?path=transport');
  for(const value of ['https://example.com','//example.com','/events/not-real','/learn/cpi','/events/el-nino-2023#evil'])expect(safeEventReturn(value)).toBeUndefined();
  open('/events/not-real');expect(screen.getByRole('heading',{name:'暂未提供这个事件'})).toBeVisible();
 });
});

