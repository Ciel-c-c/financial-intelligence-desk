import { deriveFreshness, formatSnapshotTime } from '../data/globalSituation';
import type { GlobalSituationSnapshot } from '../data/globalSituationTypes';

export function FreshnessBanner({ snapshot }: { snapshot: GlobalSituationSnapshot }) {
  const view = deriveFreshness(snapshot);
  return <aside className={`freshness freshness-${view.tone}`} aria-label="全球局势数据状态">
    <div><span className="freshness-dot" aria-hidden="true" /><strong>{view.label}</strong><span>最后更新：{formatSnapshotTime(snapshot.lastSuccessfulAt)}</span></div>
    <p>{view.detail}</p>
    <details><summary>查看数据源状态</summary><ul>{snapshot.sourceHealth.map(source => <li key={source.id}><span>{source.name}</span><b>{source.status === 'ok' ? `正常 · ${source.itemCount} 条原始更新` : '异常'}</b></li>)}</ul></details>
  </aside>;
}
