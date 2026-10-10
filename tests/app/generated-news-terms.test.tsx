import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import {expect,it} from 'vitest';
import {NewsArticle} from '../../src/components/NewsArticle';
import {news} from '../../src/data/demoData';
it('restores term explanations for generated articles whose stored term IDs are empty',async()=>{
 const item={...news[0],termIds:[],title:'最新物价报道',topic:'经济数据',summary:'本次CPI数据影响利率预期。',excerpt:'CPI是消费者价格指数，利率变化还会影响估值。'};
 render(<MemoryRouter><NewsArticle item={item}/></MemoryRouter>);
 await userEvent.click(screen.getByRole('button',{name:/CPI/}));
 expect(screen.getByRole('heading',{name:'专业定义'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'大白话'})).toBeInTheDocument();expect(screen.getByRole('heading',{name:'为什么市场在意？'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:/现金流折现与估值倍数/})).toHaveAttribute('href','/learn/valuation');
});
it('does not add unrelated finance terms to a report with no relevant terminology',()=>{
 const item={...news[0],termIds:[],title:'服务规则调整',topic:'服务',summary:'企业调整服务安排。',excerpt:'报道介绍具体服务规则。',facts:['服务规则调整。'],consensus:['服务选择可能变化。'],inference:['需要观察规则落实。'],risks:['规则可能不落实。'],causalChain:[{title:'规则调整',explanation:'条款可能变化。',condition:'实施调整。'}]};
 render(<MemoryRouter><NewsArticle item={item}/></MemoryRouter>);expect(screen.queryByRole('button',{name:/CPI|利率|估值|业绩指引/})).not.toBeInTheDocument();
});
