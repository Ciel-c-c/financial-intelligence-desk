import { useCallback,useEffect,useState,useRef } from 'react';
import { loadNewsFeed } from './newsFeed';
import { newsFeedSeed } from './newsFeedSeed';
export function useNewsFeed({fetcher=fetch,refreshIntervalMs=300_000}:{fetcher?:typeof fetch;refreshIntervalMs?:number}={}){
 const [snapshot,setSnapshot]=useState(newsFeedSeed);
 const [loading,setLoading]=useState(true);const [error,setError]=useState<string>();
 const lastCheckedAt=useRef(0),inFlight=useRef(false);
 const reload=useCallback(async()=>{if(inFlight.current)return;inFlight.current=true;lastCheckedAt.current=Date.now();setLoading(true);try{const value=await loadNewsFeed(fetcher);setSnapshot(value);setError(value.status==='source_error'?value.message:undefined);}catch(value){setError(value instanceof Error?value.message:String(value));}finally{inFlight.current=false;setLoading(false);}},[fetcher]);
 useEffect(()=>{void reload();},[reload]);
 useEffect(()=>{
   const refresh=()=>{if(document.visibilityState==='visible'&&Date.now()-lastCheckedAt.current>=refreshIntervalMs)void reload();};
   document.addEventListener('visibilitychange',refresh);
   const timer=window.setInterval(refresh,refreshIntervalMs);
   return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[reload,refreshIntervalMs]);
 return{snapshot,loading,error,reload};
}
