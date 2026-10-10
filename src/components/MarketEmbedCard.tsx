import {useEffect,useRef,useState} from 'react';
import {MARKET_EMBED_SCRIPT,type MarketEmbedAsset} from '../data/marketEmbeds';
export function MarketEmbedCard({asset}:{asset:MarketEmbedAsset}){
 const host=useRef<HTMLDivElement>(null);
 const [status,setStatus]=useState<'loading'|'embedded'|'failed'>('loading');
 useEffect(()=>{
  const container=host.current;if(!container)return;
  setStatus('loading');let active=true;let loaded=false;
  const frames=new Map<HTMLIFrameElement,()=>void>();
  const widget=document.createElement('div');widget.className='tradingview-widget-container__widget';
  const script=document.createElement('script');script.src=MARKET_EMBED_SCRIPT;script.type='text/javascript';script.async=true;
  script.textContent=JSON.stringify({symbols:[[asset.name,asset.symbol+'|1D']],width:'100%',height:260,autosize:true,colorTheme:'light',isTransparent:true,locale:'zh_CN',chartOnly:false,hideDateRanges:true,hideMarketStatus:false,dateRanges:['1m|1D']});
  script.onerror=()=>{if(active)setStatus('failed');};
  const observer=new MutationObserver(()=>{
   const frame=container.querySelector('iframe');if(frame){
    frame.title=asset.name+'行情 · TradingView';frame.loading='lazy';
    if(!frames.has(frame)){
     const onLoad=()=>{if(active&&frame.src&&frame.src!=='about:blank'){loaded=true;setStatus('embedded');}};
     frame.addEventListener('load',onLoad);frames.set(frame,onLoad);
    }
   }
  });observer.observe(container,{childList:true,subtree:true});
  const timer=window.setTimeout(()=>{if(active&&!loaded)setStatus('failed');},15000);
  container.append(widget,script);
  return ()=>{active=false;window.clearTimeout(timer);observer.disconnect();frames.forEach((listener,frame)=>frame.removeEventListener('load',listener));script.onerror=null;container.replaceChildren();};
 },[asset.name,asset.symbol]);
 return <article className="market-card market-embed-card">
  <div className="card-row"><span className="eyebrow">{asset.symbol}</span><small>第三方行情组件</small></div>
  <div className="market-card-body"><div className="market-quote"><h3>{asset.name}</h3>
   {status==='loading'&&<p role="status">正在加载行情组件…</p>}
   {status==='failed'&&<p role="alert">行情组件加载失败，请查看原始行情页面。</p>}
   <div ref={host} className="tradingview-widget-container" style={{width:'100%',maxWidth:'100%',height:status==='failed'?undefined:260}}/>
  </div></div>
  <small>TradingView 提供 · {asset.dataNote}<br />报价与交易日期以组件内显示为准。若未显示日期，不作为已核验收盘数据。<br /><a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer">{asset.name}原始行情 ↗</a></small>
 </article>;
}
