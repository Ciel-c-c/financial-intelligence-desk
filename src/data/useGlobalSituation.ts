import { useEffect, useState } from 'react';
import { loadGlobalSituation } from './globalSituation';
import type { GlobalSituationSnapshot } from './globalSituationTypes';
import { useBrowserTranslation } from '../components/BrowserTranslation';

export function useGlobalSituation() {
  const [snapshot,setSnapshot] = useState<GlobalSituationSnapshot>({ schemaVersion:2, attemptedAt:new Date().toISOString(), lastSuccessfulAt:null, status:'unavailable', sourceHealth:[], events:[] });
  const [raw,setRaw]=useState(snapshot);
  const {translate,reportError}=useBrowserTranslation();
  useEffect(() => { let active = true; loadGlobalSituation().then(value => { if (active) {setRaw(value);setSnapshot(value);} }); return () => { active = false; }; }, []);
  useEffect(()=>{
    let cancelled=false;
    if(!translate) return;
    const convert=async(text:string)=>{
      if(!text||/[\u3400-\u9fff]/.test(text)||!/[a-z]{3}/i.test(text)) return text;
      try{return await translate(text);}catch(value){reportError?.(value instanceof Error?value.message:'翻译失败，保留原文。');return text;}
    };
    void Promise.all(raw.events.map(async event=>({...event,sourceHeadline:event.sourceHeadline??event.headline,headline:await convert(event.headline),oneLine:await convert(event.oneLine),summary:await convert(event.summary),fact:await Promise.all(event.fact.map(convert))}))).then(events=>{if(!cancelled)setSnapshot({...raw,events});});
    return ()=>{cancelled=true;};
  },[raw,translate,reportError]);
  return snapshot;
}
