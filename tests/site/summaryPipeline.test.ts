import { describe, expect, it } from 'vitest';
import { buildMarketSummary, selectCoreTransmission } from '../../scripts/site/summary-pipeline.mjs';

const market = [{ name: '指数甲', changePercent: 1.1 }, { name: '指数乙', changePercent: -0.2 }];
const sectors = [{ name: '科技', changePercent: 2 }, { name: '金融', changePercent: -1 }];

describe('market summary pipeline', () => {
  it('outputs facts without inventing an explanation', () => {
    const summary = buildMarketSummary(market, sectors, []);
    expect(summary.fact).toContain('1 个上涨');
    expect(summary.fact).toContain('科技');
    expect(summary.explanation).toBeUndefined();
  });

  it('accepts only sourced explanations', () => {
    const summary = buildMarketSummary(market, sectors, [{ id: 'n1', explanation: '政策改变了融资预期', confidence: 'supported' }]);
    expect(summary.explanation).toEqual({ text: '政策改变了融资预期', evidenceIds: ['n1'] });
  });

  it('requires 3–6 causal nodes and an invalidation condition', () => {
    const chain = selectCoreTransmission([{ id: 'n1', importanceScore: 90, nodes: ['政策变化', '融资成本变化', '投资意愿变化'], condition: '如果政策落地力度不及预期，传导会减弱', evidenceIds: ['n1'] }]);
    expect(chain?.nodes).toHaveLength(3);
    expect(chain?.condition).toContain('如果');
    expect(selectCoreTransmission([{ id: 'bad', importanceScore: 99, nodes: ['A', 'B'], condition: '条件', evidenceIds: ['bad'] }])).toBeUndefined();
  });
});
