import {expect,it} from 'vitest';
import {parseMarketReport} from '../../scripts/site/market-report-parser.mjs';
const now='2026-10-10T12:00:00Z';
const policy={id:'fixture-source',name:'Fixture',baseUrl:'https://market.test/report/close',enabled:true,usageMode:'report-facts',allowedHosts:['market.test'],allowedPathPatterns:['^/report/'],markets:['aShare','hongKong','us'],reviewedAt:'2026-10-01T00:00:00Z',reviewExpiresAt:'2026-12-01T00:00:00Z'};
const report={sourceId:policy.id,url:policy.baseUrl,publishedAt:'2026-10-10T05:15:00+08:00',title:'市场收盘报道',text:'2026年10月9日，截至收盘，上证指数收于3,888.11点，跌1.18%。市场成交结构出现变化，本文记录当日收盘表现而非未来预测，其他数据需结合原始来源查看。'};
it('extracts a Chinese close level and its paired percentage',()=>{
 const rows=parseMarketReport(report,{now,policy});expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({id:'sse-composite',value:3888.11,changePercent:-1.18,tradingDate:'2026-10-09',session:'close',provenance:'report'});
});
it('keeps US trade date separate from next-day Beijing publication',()=>{
 const text='On October 9, 2026, the S&P 500 closed at 7,811.54, up 0.59%. Investors monitored incoming economic news. This is a closing report rather than a forecast of future performance.';
 const rows=parseMarketReport({...report,text},{now,policy});expect(rows[0]).toMatchObject({id:'sp500',value:7811.54,tradingDate:'2026-10-09',timeZone:'America/New_York',session:'close',changePercent:0.59});
});
it('binds an observation to its own date instead of the first background date',()=>{
 const text='On October 8, 2026, investors awaited jobs data. On October 9, 2026, the S&P 500 closed at 7,811.54, up 0.59%. The reported close is distinct from the previous background event.';
 expect(parseMarketReport({...report,text},{now,policy})[0]?.tradingDate).toBe('2026-10-09');
});
it('withholds a publication-header date when the local report refers to another day',()=>{
 const text='发布时间2026年10月10日。美股9日收盘，上证指数收于3,888.11点，跌1.18%。本段只是解析器安全测试，发布时间不能被误当作实际交易日期。';
 expect(parseMarketReport({...report,text},{now,policy})).toEqual([]);
});
it('extracts opening values only when the source explicitly reports the opening',()=>{
 const rows=parseMarketReport({...report,text:report.text.replace('截至收盘','开盘').replace('收于','开盘报')},{now,policy});expect(rows[0]?.session).toBe('open');
});
it.each([
 report.text.replace('2026年10月9日','昨日'),
 report.text.replace('收于3,888.11点，',''),
 report.text.replace('上证指数','上证指数期货'),
 report.text.replace('上证指数','上证指数ETF'),
 report.text.replace('截至收盘','预计收盘'),
 report.text.replace('截至收盘','今年以来'),
 report.text.replace('截至收盘','盘前'),
 '<html><nav>市场收盘报道</nav></html>',
])('withholds ambiguous or non-session reports %s',text=>{expect(parseMarketReport({...report,text},{now,policy})).toEqual([]);});
it('does not mix percentages from the next index or treat Hong Kong auctions as the final close',()=>{
 const text='2026年10月9日，截至收盘，上证指数收于3,888.11点。深证成指收于13,000.00点，跌2.00%。恒生指数收市竞价阶段暂报24000点。其他指数表现仍需以官方最终收市结果为准。';
 const rows=parseMarketReport({...report,text},{now,policy});expect(rows).toHaveLength(2);expect(rows[0].changePercent).toBeUndefined();expect(rows[1].changePercent).toBe(-2);
});
