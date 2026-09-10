import { useState } from 'react';
import { findLesson } from './curriculum';
const key = 'fid-learned-terms';
export function loadProgress(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && !!findLesson(id)))] : [];
  } catch { return []; }
}
export function useLearningProgress() {
  const [learned, setLearned] = useState(loadProgress);
  const [saveError, setSaveError] = useState(false);
  function update(id: string, checked: boolean) {
    const next = checked ? [...new Set([...learned,id])] : learned.filter(value => value !== id);
    setLearned(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setSaveError(false); }
    catch { setSaveError(true); }
  }
  return { learned, update, saveError };
}
