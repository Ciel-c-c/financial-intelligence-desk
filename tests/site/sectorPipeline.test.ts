import { describe, expect, it } from 'vitest';
import { buildSectorPerformance, matchDriverEvidence, validateSectorPerformance } from '../../scripts/site/sector-pipeline.mjs';

const now = '2026-09-14T02:00:00Z';
const source = { id: 'sector-source', name: 'Sector Source', url: 'https://example.test/sectors' };

describe('sector performance pipeline', () => {
  it('keeps each classification inside its market group and ranks by return', () => {
    const snapshot = buildSectorPerformance({ attemptedAt: now, marketInputs: [
      { id: 'cn-tech', market: 'aShare', classification: '中证行业', name: '信息技术', changePercent: 1.2, dataAsOf: now, source, driverTopicIds: ['technology'], requiredMechanism: '需求' },
      { id: 'cn-bank', market: 'aShare', classification: '中证行业', name: '金融', changePercent: -0.8, dataAsOf: now, source, driverTopicIds: ['rates'], requiredMechanism: '息差' },
      { id: 'us-tech', market: 'us', classification: '行业代理资产', name: '美国科技', changePercent: 0.5, dataAsOf: now, source, driverTopicIds: ['technology'], requiredMechanism: '估值' },
    ], evidence: [] });
    expect(snapshot.groups.aShare.map((item: { id: string }) => item.id)).toEqual(['cn-tech', 'cn-bank']);
    expect(snapshot.groups.aShare.every((item: { market: string }) => item.market === 'aShare')).toBe(true);
    expect(snapshot.groups.us[0].classification).toBe('行业代理资产');
    expect(validateSectorPerformance(snapshot)).toBe(true);
  });

  it('does not invent a driver without a matching causal mechanism', () => {
    const sector = { market: 'aShare', driverTopicIds: ['energy'], requiredMechanism: '投入成本' };
    expect(matchDriverEvidence(sector, [{ id: 'n1', regions: ['中国'], topicIds: ['energy'], causalNodes: ['风险偏好'], explanation: '油价变化' }])).toBeUndefined();
  });

  it('attaches traceable evidence only when region, topic and mechanism match', () => {
    const sector = { market: 'aShare', driverTopicIds: ['energy'], requiredMechanism: '投入成本' };
    expect(matchDriverEvidence(sector, [{ id: 'n1', regions: ['中国'], topicIds: ['energy'], causalNodes: ['投入成本'], explanation: '油价影响企业成本' }])).toEqual({ summary: '油价影响企业成本', evidenceIds: ['n1'], confidence: 'supported' });
  });

  it('publishes unavailable groups instead of demo sectors', () => {
    const snapshot = buildSectorPerformance({ attemptedAt: now, marketInputs: [], evidence: [] });
    expect(snapshot.status).toBe('unavailable');
    expect(snapshot.groups.hongKong).toEqual([]);
  });
});
