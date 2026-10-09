import { useCallback,useEffect,useState,useRef } from 'react';
import { loadNewsFeed } from './newsFeed';
import { newsFeedSeed } from './newsFeedSeed';
import { useBrowserTranslation } from '../components/BrowserTranslation';
import type { LiveNewsItem } from './newsFeedTypes';
export function useNewsFeed({fetcher=fetch,refreshIntervalMs=300_000}:{fetcher?:typeof fetch;refreshIntervalMs?:number}={}){
 const [raw,setRaw]=useState(newsFeedSeed);const [snapshot,setSnapshot]=useState(newsFeedSeed);
 const [loading,setLoading]=useState(true);const [error,setError]=useState<string>();
 const {translate,reportError}=useBrowserTranslation();
 const lastCheckedAt=useRef(0),inFlight=useRef(false);
 const reload=useCallback(async()=>{if(inFlight.current)return;inFlight.current=true;lastCheckedAt.current=Date.now();setLoading(true);try{const value=await loadNewsFeed(fetcher);setRaw(value);setSnapshot(value);setError(value.status==='source_error'?value.message:undefined);}catch(value){setError(value instanceof Error?value.message:String(value));}finally{inFlight.current=false;setLoading(false);}},[fetcher]);
 useEffect(()=>{void reload();},[reload]);
 useEffect(()=>{
   const refresh=()=>{if(document.visibilityState==='visible'&&Date.now()-lastCheckedAt.current>=refreshIntervalMs)void reload();};
   document.addEventListener('visibilitychange',refresh);
   const timer=window.setInterval(refresh,refreshIntervalMs);
   return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[reload,refreshIntervalMs]);
 useEffect(()=>{
   let cancelled=false;
   if(!translate) return;
   async function convert(item:LiveNewsItem):Promise<LiveNewsItem>{
     if(item.originalLanguage!=='en'||item.titleZh) return item;
     try{
       const titleZh=await translate!(item.originalTitle);
       const summaryZh=item.originalSummary?await translate!(item.originalSummary):undefined;
       const facts=await Promise.all((item.facts??[]).map(translate!));
       return {...item,titleZh,summaryZh,facts,translationStatus:'generated'};
     }catch(value){reportError?.(value instanceof Error?value.message:'翻译失败，保留原文。');return item;}
   }
   void Promise.all([raw.latest,raw.continuing,raw.retainedDetails].map(list=>Promise.all(list.map(convert)))).then(([latest,continuing,retainedDetails])=>{if(!cancelled)setSnapshot({...raw,latest,continuing,retainedDetails});});
   return ()=>{cancelled=true;};
 },[raw,translate,reportError]);
 return{snapshot,loading,error,reload};
}
