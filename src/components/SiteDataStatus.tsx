import type { SiteSnapshot } from '../data/siteSnapshotTypes';

const labels = { fresh: '数据正常', partial: '部分数据延迟', delayed: '数据延迟', unavailable: '暂无可靠数据' } as const;
const format = (value: string | null | undefined) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '尚未成功';

export function SiteDataStatus({ snapshot, errors, onRefresh }: { snapshot?: SiteSnapshot; errors?: Record<string, string>; onRefresh: () => void }) {
  const status = snapshot?.status ?? 'unavailable';
  return <details className={`site-data-status ${status}`}>
    <summary><span>{labels[status]}</span><small>最近成功：{format(snapshot?.lastSuccessfulAt)}</small></summary>
    <div>{snapshot?.datasets.map(item => <p key={item.id}><b>{item.id}</b><span>{labels[item.status]} · 数据截至 {format(item.dataAsOf)}</span>{item.fallbackReason && <small>{item.fallbackReason}</small>}</p>) ?? <p>无法读取全站状态索引。</p>}{errors && Object.values(errors).map(error => <small key={error}>{error}</small>)}<button type="button" onClick={onRefresh}>检查更新</button></div>
  </details>;
}
