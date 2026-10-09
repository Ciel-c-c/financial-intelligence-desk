import {render,screen} from '@testing-library/react';
import {expect,it} from 'vitest';
import {MarketOverview} from '../../src/components/MarketOverview';
import type {MarketOverviewSnapshot} from '../../src/data/siteSnapshotTypes';
it('does not label missing price changes as an increase',()=>{
 const snapshot={groups:{aShare:[],hongKong:[],us:[],globalAssets:[{id:'EURUSD',group:'globalAssets',name:'欧元兑美元',symbol:'EURUSD',value:1.1,marketState:'previous_close',dataAsOf:'2026-10-08T00:00:00Z',source:{name:'ECB',url:'https://www.ecb.europa.eu'}}]},groupHealth:{globalAssets:{status:'fresh'}}} as MarketOverviewSnapshot;
 render(<MarketOverview snapshot={snapshot} activeGroup="globalAssets" onGroupChange={()=>{}}/>);
 expect(screen.queryByText(/↑ 上涨/)).not.toBeInTheDocument();
 expect(screen.getByText(/涨跌幅暂无/)).toBeInTheDocument();
});
