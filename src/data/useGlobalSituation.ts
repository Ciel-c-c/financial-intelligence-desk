import { useEffect, useState } from 'react';
import { loadGlobalSituation } from './globalSituation';
import type { GlobalSituationSnapshot } from './globalSituationTypes';

export function useGlobalSituation() {
  const [snapshot,setSnapshot] = useState<GlobalSituationSnapshot>({ schemaVersion:2, attemptedAt:new Date().toISOString(), lastSuccessfulAt:null, status:'unavailable', sourceHealth:[], events:[] });
  useEffect(() => { let active = true; loadGlobalSituation().then(value => { if (active) setSnapshot(value); }); return () => { active = false; }; }, []);
  return snapshot;
}
