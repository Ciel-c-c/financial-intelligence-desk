import { useEffect, useState } from 'react';
import { globalSituationSeed } from './globalSituationSeed';
import { loadGlobalSituation } from './globalSituation';
import type { GlobalSituationSnapshot } from './globalSituationTypes';

export function useGlobalSituation() {
  const [snapshot,setSnapshot] = useState<GlobalSituationSnapshot>(globalSituationSeed);
  useEffect(() => { let active = true; loadGlobalSituation().then(value => { if (active) setSnapshot(value); }); return () => { active = false; }; }, []);
  return snapshot;
}
