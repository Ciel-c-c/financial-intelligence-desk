import type {MarketGroup} from './siteSnapshotTypes';
export interface MarketEmbedAsset { id:string; group:MarketGroup; name:string; symbol:string; sourceUrl:string; dataNote:string }
// Publisher symbol identity is verified. Actual widget availability is governed
// by the provider at runtime; never substitute CFDs/futures when restricted.
export const marketEmbedAssets:MarketEmbedAsset[]=[
 {id:'sse-composite',group:'aShare',name:'上证指数',symbol:'SSE:000001',sourceUrl:'https://www.tradingview.com/symbols/SSE-000001/',dataNote:'服务商日终数据'},
 {id:'szse-component',group:'aShare',name:'深证成指',symbol:'SZSE:399001',sourceUrl:'https://www.tradingview.com/symbols/SZSE-399001/',dataNote:'服务商日终数据'},
 {id:'chinext',group:'aShare',name:'创业板指',symbol:'SZSE:399006',sourceUrl:'https://www.tradingview.com/symbols/SZSE-399006/',dataNote:'服务商日终数据'},
 {id:'hang-seng',group:'hongKong',name:'恒生指数',symbol:'HSI:HSI',sourceUrl:'https://www.tradingview.com/symbols/HSI-HSI/',dataNote:'服务商日终数据'},
 {id:'hang-seng-tech',group:'hongKong',name:'恒生科技指数',symbol:'HSI:HSTECH',sourceUrl:'https://www.tradingview.com/symbols/HSI-HSTECH/',dataNote:'服务商日终数据'},
 {id:'sp500',group:'us',name:'标普500',symbol:'SP:SPX',sourceUrl:'https://www.tradingview.com/symbols/SP-SPX/',dataNote:'可能受组件授权限制；不替换为CFD'},
 {id:'dow-jones',group:'us',name:'道琼斯指数',symbol:'DJ:DJI',sourceUrl:'https://www.tradingview.com/symbols/DJ-DJI/',dataNote:'可能受组件授权限制；不替换为CFD'},
 {id:'nasdaq-composite',group:'us',name:'纳斯达克综合指数',symbol:'NASDAQ:IXIC',sourceUrl:'https://www.tradingview.com/symbols/NASDAQ-IXIC/',dataNote:'可能受组件授权限制；不替换为CFD'},
];
export const MARKET_EMBED_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
