import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  clusterEvents,
  classifyItem,
  parseFeed,
  scoreMarketRelevance,
} from '../scripts/global-situation-core.mjs';

const fetchedAt = '2026-09-11T03:00:00.000Z';

describe('global situation ingestion', () => {
  it('parses RSS and Atom into the same source item contract', () => {
    const rss = `<?xml version="1.0"?><rss><channel><item><title>Fed keeps policy rate unchanged</title><link>https://example.test/fed</link><description><![CDATA[The Committee maintained its target range.]]></description><pubDate>Thu, 10 Sep 2026 18:00:00 GMT</pubDate></item></channel></rss>`;
    const atom = `<?xml version="1.0"?><feed><entry><title>ECB publishes monetary policy decision</title><link href="https://example.test/ecb"/><summary>Rates remain unchanged.</summary><updated>2026-09-10T12:00:00Z</updated></entry></feed>`;

    expect(parseFeed(rss, { id: 'fed', name: 'Federal Reserve', url: 'https://example.test/rss' }, fetchedAt)[0]).toMatchObject({
      headline: 'Fed keeps policy rate unchanged',
      source: 'Federal Reserve',
      sourceUrl: 'https://example.test/fed',
      summary: 'The Committee maintained its target range.',
      publishedAt: '2026-09-10T18:00:00.000Z',
      fetchedAt,
    });
    expect(parseFeed(atom, { id: 'ecb', name: 'European Central Bank', url: 'https://example.test/atom' }, fetchedAt)[0].sourceUrl).toBe('https://example.test/ecb');
  });

  it('scores the eleven financial transmission criteria at stable boundaries', () => {
    expect(scoreMarketRelevance(['energySupply', 'inflation', 'centralBank', 'riskAppetite', 'marketReaction', 'growth'])).toEqual({ level: 'high', score: 6 });
    expect(scoreMarketRelevance(['trade', 'supplyChain', 'earnings'])).toEqual({ level: 'medium', score: 3 });
    expect(scoreMarketRelevance(['fiscalPolicy', 'growth'])).toEqual({ level: 'low', score: 2 });
  });

  it('classifies policy and conflict language into finance-first fields', () => {
    const conflict = classifyItem({ headline: 'Shipping disruption near key oil route raises supply concerns', summary: 'Insurers and energy importers assess the disruption.', source: 'UN News', sourceUrl: 'https://example.test/a', publishedAt: fetchedAt, fetchedAt });
    expect(conflict).toMatchObject({ region: 'middle-east', eventType: 'energy-security' });
    expect(conflict.relevance.criteria).toEqual(expect.arrayContaining(['energySupply', 'trade', 'supplyChain', 'inflation', 'earnings', 'riskAppetite']));
    expect(conflict.knowledgeIds).toEqual(expect.arrayContaining(['geopolitics', 'supply-demand', 'cpi']));

    const unrelated = classifyItem({ headline: "Warning against scams using an institution's name", summary: 'A public safety notice.', source: 'Official source', sourceUrl: 'https://example.test/b', publishedAt: fetchedAt, fetchedAt });
    expect(unrelated.relevance.level).toBe('low');

    const speech = classifyItem({ headline: 'Speech on economic activity, prices and monetary policy', summary: '', source: 'Bank of Japan', sourceUrl: 'https://example.test/c', publishedAt: fetchedAt, fetchedAt });
    expect(speech.relevance.level).toBe('medium');
  });

  it('clusters one event reported by multiple sources without losing provenance', () => {
    const base = { summary: 'Policy update', fetchedAt, region: 'united-states', eventType: 'monetary-policy' };
    const items = [
      { ...base, headline: 'Federal Reserve keeps interest rates unchanged after meeting', source: 'Federal Reserve', sourceUrl: 'https://example.test/one', publishedAt: '2026-09-10T18:00:00Z' },
      { ...base, headline: 'Fed keeps rates unchanged following policy meeting', source: 'Official briefing', sourceUrl: 'https://example.test/two', publishedAt: '2026-09-10T19:00:00Z' },
    ];
    const clustered = clusterEvents(items);
    expect(clustered).toHaveLength(1);
    expect(clustered[0].sources).toHaveLength(2);
    expect(clustered[0].sources.map((source: { name: string }) => source.name)).toEqual(expect.arrayContaining(['Federal Reserve', 'Official briefing']));
  });

  it('preserves the last successful events and marks an all-source failure', () => {
    const previous = { schemaVersion: 1, attemptedAt: '2026-09-10T03:00:00Z', lastSuccessfulAt: '2026-09-10T03:00:00Z', status: 'latest', sourceHealth: [], events: [{ id: 'kept-event' }] };
    const result = buildSnapshot({ attemptedAt: fetchedAt, sourceResults: [{ id: 'fed', name: 'Federal Reserve', ok: false, items: [], error: 'timeout' }], previous });
    expect(result.status).toBe('source_error');
    expect(result.lastSuccessfulAt).toBe('2026-09-10T03:00:00Z');
    expect(result.events).toEqual([{ id: 'kept-event' }]);
  });

  it('marks partial coverage while publishing successful sources', () => {
    const item = { headline: 'ECB monetary policy decision', summary: 'The Governing Council published its decision.', source: 'European Central Bank', sourceUrl: 'https://example.test/ecb', publishedAt: fetchedAt, fetchedAt };
    const result = buildSnapshot({ attemptedAt: fetchedAt, sourceResults: [
      { id: 'ecb', name: 'European Central Bank', ok: true, items: [item] },
      { id: 'boj', name: 'Bank of Japan', ok: false, items: [], error: 'timeout' },
    ] });
    expect(result.status).toBe('delayed');
    expect(result.lastSuccessfulAt).toBe(fetchedAt);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0]).toHaveProperty('fact');
    expect(result.events[0]).toHaveProperty('marketView');
    expect(result.events[0]).toHaveProperty('scenarios');
    expect(result.events[0].relatedKnowledgePoints).toEqual(result.events[0].knowledgeIds);
    expect(result.events[0]).toMatchObject({ marketRelevance:'high', oneSentenceExplanation:expect.any(String), factSummary:expect.any(String) });
  });
});
