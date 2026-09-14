import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteDataStatus } from '../../src/components/SiteDataStatus';

describe('SiteDataStatus', () => {
  it('keeps dataset time and degradation reason visible when expanded', () => {
    render(<SiteDataStatus onRefresh={vi.fn()} snapshot={{ schemaVersion:1, attemptedAt:'2026-09-14T02:00:00Z', lastSuccessfulAt:'2026-09-14T01:00:00Z', status:'partial', datasets:[{ id:'market-overview', status:'delayed', freshness:'close', lastSuccessfulAt:'2026-09-14T01:00:00Z', dataAsOf:'2026-09-13T20:00:00Z', nextExpectedAt:'2026-09-14T03:00:00Z', fallbackReason:'本轮来源超时' }] }} />);
    expect(screen.getByText('部分数据延迟')).toBeInTheDocument();
    expect(screen.getByText(/本轮来源超时/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name:'检查更新' })).toBeInTheDocument();
  });
});
