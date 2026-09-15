import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createChineseTranslator, translatePreservingNumbers, type NativeTranslator, type NativeTranslatorAPI } from '../data/browserTranslation';

const TranslationContext=createContext<{translate?:(text:string)=>Promise<string>;reportError?:(message:string)=>void;enable?:()=>Promise<void>;busy?:boolean;error?:string}>({});
export const useBrowserTranslation=()=>useContext(TranslationContext);
export function BrowserTranslationProvider({children}:{children:ReactNode}){
  const [translator,setTranslator]=useState<NativeTranslator>();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const cache=useRef(new Map<string,Promise<string>>());
  const reportError=useCallback((message:string)=>setError(message),[]);
  const translate=useCallback((text:string)=>{
    if(!translator||!text.trim()) return Promise.resolve(text);
    let promise=cache.current.get(text);
    if(!promise){promise=translatePreservingNumbers(translator,text);cache.current.set(text,promise);}
    return promise;
  },[translator]);
  async function enable(){
    setBusy(true);setError('');
    try{const api=(globalThis as unknown as {Translator?:NativeTranslatorAPI}).Translator;setTranslator(await createChineseTranslator(api));}
    catch(value){setError(value instanceof Error?value.message:'翻译初始化失败，保留原文。');}
    finally{setBusy(false);}
  }
  return <TranslationContext.Provider value={{translate:translator?translate:undefined,reportError,enable,busy,error}}>{children}</TranslationContext.Provider>;
}
export function BrowserTranslationControl(){
  const {translate,enable,busy,error}=useBrowserTranslation();
  return <div className="translation-control"><button type="button" disabled={busy||!!translate} onClick={()=>void enable?.()}>{busy?'准备本机语言模型…':translate?'免费中文翻译已启用':'启用免费中文翻译'}</button><small>浏览器本机翻译，首次可能下载语言模型；非官方译文，原文保留。</small>{error&&<p role="status">{error}</p>}</div>;
}
