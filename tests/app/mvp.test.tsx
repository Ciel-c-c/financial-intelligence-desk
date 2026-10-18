import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it,vi} from 'vitest';
import {App} from '../../src/app/App';
import {isGlobalNews} from '../../src/data/globalNews';
it('opens news and filters without market panels',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
 const {container}=render(<MemoryRouter><App/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'资讯'})).toBeInTheDocument();
 expect(container.querySelector('.market-overview')).toBeNull();
 expect(screen.queryByText('行业相对强弱')).toBeNull();
 expect(await screen.findByRole('searchbox')).toBeInTheDocument();
 vi.unstubAllGlobals();
});
it('selects macro and geopolitical topics without requiring financial analysis',()=>{
 expect(isGlobalNews({eventTypes:[],analysisLevels:[],originalTitle:'Diplomats discuss Russia sanctions'} as any)).toBe(true);
 expect(isGlobalNews({eventTypes:[],analysisLevels:[],originalTitle:'Luxury holiday boat photographs'} as any)).toBe(false);
 expect(isGlobalNews({eventTypes:['地缘风险'],analysisLevels:[]} as any)).toBe(true);
 expect(isGlobalNews({eventTypes:['公司经营'],analysisLevels:['公司']} as any)).toBe(false);
 expect(isGlobalNews({eventTypes:['经济数据'],analysisLevels:[]} as any)).toBe(true);
});
