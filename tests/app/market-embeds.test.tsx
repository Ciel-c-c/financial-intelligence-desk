import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {MarketOverview} from '../../src/components/MarketOverview';
const renderGroup=(group:'aShare'|'hongKong'|'us'|'globalAssets'='aShare')=>render(<MarketOverview activeGroup={group} onGroupChange={()=>{}}/>);
it('uses original glass cards and attributed third-party display without inventing snapshot values or times',()=>{
 const {container}=renderGroup();expect(screen.getByRole('heading',{name:'上证指数'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'深证成指'})).toBeInTheDocument();expect(container.querySelectorAll('article.market-card')).toHaveLength(3);
 expect(screen.getByText(/非本站开收盘快照/)).toBeInTheDocument();expect(screen.getAllByText(/TradingView 提供/)).toHaveLength(3);expect(screen.queryByText(/数据截至/)).not.toBeInTheDocument();
 expect(container.querySelectorAll('article.market-embed-card')).toHaveLength(3);
});
it('loads the documented widget with real index symbols, daily data and Chinese locale',()=>{
 const {container}=renderGroup();const scripts=[...container.querySelectorAll('script')];expect(scripts).toHaveLength(3);
 expect(scripts[0].src).toBe('https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js');
 const config=JSON.parse(scripts[0].textContent!);expect(config.symbols).toEqual([['上证指数','SSE:000001|1D']]);expect(config.locale).toBe('zh_CN');expect(config.width).toBe('100%');
 expect(scripts.map(script=>script.textContent).join('')).not.toMatch(/FOREXCOM|SPCFD|TVC:|!\|/);
});
it('uses cash-index identities for Hong Kong and US instead of quietly substituting CFDs',()=>{
 const hk=renderGroup('hongKong');expect(screen.getByRole('heading',{name:'恒生指数'})).toBeInTheDocument();expect(hk.container.querySelector('script')!.textContent).toContain('HSI:HSI');hk.unmount();
 const us=renderGroup('us');expect(us.container.querySelector('script')!.textContent).toContain('SP:SPX');expect(us.container.textContent).toContain('授权限制');
});
it('reports a script loading failure accessibly and leaves a usable original-source link',()=>{
 const {container}=renderGroup();fireEvent.error(container.querySelector('script')!);
 expect(screen.getByRole('alert')).toHaveTextContent('行情组件加载失败');expect(screen.getByRole('link',{name:'上证指数原始行情 ↗'})).toHaveAttribute('href','https://www.tradingview.com/symbols/SSE-000001/');
});
it('gives injected frames accessible titles without claiming their numbers are verified',async()=>{
 const {container}=renderGroup();const frame=document.createElement('iframe');
 act(()=>{container.querySelector('.tradingview-widget-container__widget')!.appendChild(frame);});
 await waitFor(()=>expect(frame).toHaveAttribute('title','上证指数行情 · TradingView'));
 expect(screen.queryByText(/已核验实时行情/)).not.toBeInTheDocument();
});
it('does not inject stock widgets into the global-reference tab',()=>{
 const {container}=renderGroup('globalAssets');expect(container.querySelector('script')).toBeNull();
});
it('times out an inserted frame that never completes transport loading',async()=>{
 vi.useFakeTimers();
 const view=renderGroup();
 try{
  const frame=document.createElement('iframe');frame.src='https://example.com/widget';
  await act(async()=>{view.container.querySelector('.tradingview-widget-container__widget')!.appendChild(frame);});
  act(()=>{vi.advanceTimersByTime(15000);});
  expect(screen.getAllByRole('alert')).toHaveLength(3);
  fireEvent.load(frame);
  expect(screen.getAllByRole('alert')).toHaveLength(2);
 }finally{view.unmount();vi.useRealTimers();}
});
