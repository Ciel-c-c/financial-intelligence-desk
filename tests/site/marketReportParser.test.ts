import {expect,it} from 'vitest';
import {parseMarketReport} from '../../scripts/site/market-report-parser.mjs';
const now='2026-10-10T12:00:00Z';
const policy={id:'fixture-source',name:'Fixture',baseUrl:'https://market.test/report/close',enabled:true,usageMode:'report-facts',allowedHosts:['market.test'],allowedPathPatterns:['^/report/'],markets:['aShare','hongKong','us'],reviewedAt:'2026-10-01T00:00:00Z',reviewExpiresAt:'2026-12-01T00:00:00Z'};
const report={sourceId:policy.id,url:policy.baseUrl,publishedAt:'2026-10-10T05:15:00+08:00',title:'市场收盘报道',text:'2026年10月9日，截至收盘，上证指数收于3,888.11点，跌1.18%。市场成交结构出现变化，本文记录当日收盘表现而非未来预测，其他数据需结合原始来源查看。'};
it('binds New York CNFin closes to New York publication date and formal index names',()=>{
 const r={...report,sourceId:'cnfin',title:'【环球财经】纽约股市三大股指15日均上涨',publishedAt:'2026-10-15T22:52:13Z',text:'新华财经纽约10月15日电（记者测试）美国纽约股市三大股指15日收盘时均上涨。截至当天收盘，道琼斯工业平均指数比前一交易日上涨500点，收于50000.12点，涨幅为1.00%；标准普尔500种股票指数上涨20点，收于7000.34点，涨幅为0.30%；纳斯达克综合指数上涨10点，收于25000.56点，涨幅为0.04%。以上数字为合成测试，不是真实行情。'};
 const options={now:'2026-10-16T12:00:00Z',policy:{...policy,id:'cnfin'}};
 expect(parseMarketReport(r,options).map(x=>({id:x.id,value:x.value,day:x.tradingDate,change:x.changePercent}))).toEqual([
  {id:'sp500',value:7000.34,day:'2026-10-15',change:0.3},
  {id:'dow-jones',value:50000.12,day:'2026-10-15',change:1},
  {id:'nasdaq-composite',value:25000.56,day:'2026-10-15',change:0.04}]);
 for(const text of [r.text.replace('纽约10月15日','纽约10月14日'),r.text.replace('截至当天收盘','回顾昨日，截至当天收盘'),r.text.replace('截至当天收盘','预计截至当天收盘'),r.text+'截至当天收盘，道指收于40000点，跌幅为1%。'])
  expect(parseMarketReport({...r,text},options)).toEqual([]);
});
it.each(['iso-date','english-date','negated-close','denied-percentage'])('rejects a contradicted New York close: %s',kind=>{
 let text='新华财经纽约10月15日电 美国纽约股市三大股指15日收盘时均上涨。截至当天收盘，道琼斯工业平均指数上涨500点，收于50000.12点，涨幅为1.00%；标准普尔500种股票指数上涨20点，收于7000.34点，涨幅为0.30%；纳斯达克综合指数上涨10点，收于25000.56点，涨幅为0.04%。';
 if(kind==='iso-date')text=text.replace('截至当天收盘，','截至当天收盘，2025-10-15记录：');
 if(kind==='english-date')text=text.replace('截至当天收盘，','截至当天收盘，October 15, 2025 records: ');
 if(kind==='negated-close')text=text.replace('收于50000','未收于50000');
 if(kind==='denied-percentage')text=text.replace('涨幅为1.00%','涨幅为1.00%不属实');
 expect(parseMarketReport({...report,sourceId:'cnfin',title:'【环球财经】纽约股市三大股指15日均上涨',publishedAt:'2026-10-15T22:52:13Z',text},{now:'2026-10-16T12:00:00Z',policy:{...policy,id:'cnfin'}})).toEqual([]);
});
it('binds a CNFin close paragraph to its dateline and explicit trade day, not analyst background dates',()=>{
 const p={...policy,id:'cnfin'};
 const r={...report,sourceId:'cnfin',title:'收评：合成收盘测试',publishedAt:'2026-10-09T08:00:00Z',text:'新华财经北京10月9日电 沪深两市主要股指9日早间高开，创业板指盘中回落。截至收盘，上证指数报3000.12点，涨幅0.20%；深证成指报10000.34点，跌幅0.10%；创业板指报2000.56点，跌幅0.30%。机构背景：2026年9月28日曾发布一份其他行业报告。'};
 expect(parseMarketReport(r,{now,policy:p}).map(x=>({id:x.id,value:x.value,day:x.tradingDate,change:x.changePercent}))).toEqual([
  {id:'sse-composite',value:3000.12,day:'2026-10-09',change:0.2},
  {id:'szse-component',value:10000.34,day:'2026-10-09',change:-0.1},
  {id:'chinext',value:2000.56,day:'2026-10-09',change:-0.3}]);
 expect(parseMarketReport({...r,publishedAt:'2026-10-08T08:00:00Z'},{now,policy:p})).toEqual([]);
 expect(parseMarketReport({...r,text:r.text.replace('股指9日','股指8日')},{now,policy:p})).toEqual([]);
});
it('extracts a Chinese close level and its paired percentage',()=>{
 const rows=parseMarketReport(report,{now,policy});expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({id:'sse-composite',value:3888.11,changePercent:-1.18,tradingDate:'2026-10-09',session:'close',provenance:'report'});
});
it.each([
 '回顾昨日10月8日市场，截至收盘，上证指数报3000.12点，涨幅0.20%。今日数据另见后文。',
 '回顾昨日市场。 截至收盘，上证指数报3000.12点，涨幅0.20%。',
 '如果截至收盘，上证指数报3000.12点，涨幅0.20%。',
 '预计截至收盘，上证指数报3000.12点，涨幅0.20%。',
 '截至收盘，上证指数报3000.12点，涨幅0.20%。截至收盘，上证指数报3001.12点，涨幅0.30%。',
])('does not relabel historical, hypothetical or ambiguous CNFin closing context as today',text=>{
 const r={...report,sourceId:'cnfin',title:'收评：合成测试',publishedAt:'2026-10-09T08:00:00Z',text:'新华财经北京10月9日电 沪深两市主要股指9日震荡。市场参与者同时关注行业表现及资金变化。报道列出相关市场情况，并提供原始信息以便核对。'+text};
 expect(parseMarketReport(r,{now,policy:{...policy,id:'cnfin'}})).toEqual([]);
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
