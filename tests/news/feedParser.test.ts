import { describe, expect, it, vi } from 'vitest';
import { parseNewsFeed } from '../../scripts/news/feed-parser.mjs';
import { fetchNewsSource } from '../../scripts/news/fetch-news-sources.mjs';
import { newsSources } from '../../scripts/news/source-registry.mjs';

const source = newsSources.find(item => item.id === 'fed')!;
describe('news feed adapters', () => {
  it('parses RSS while rejecting publisher-domain violations', () => {
    const xml = `<rss><channel><item><title><![CDATA[Fed &amp; rates]]></title><link>https://www.federalreserve.gov/newsevents/a.htm</link><pubDate>Sun, 14 Sep 2026 10:00:00 GMT</pubDate><description>Policy statement</description></item><item><title>Bad</title><link>https://evil.test/a</link><pubDate>Sun, 14 Sep 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
    expect(parseNewsFeed(xml, source, '2026-09-14T10:17:00Z')).toHaveLength(1);
    expect(parseNewsFeed(xml, source, '2026-09-14T10:17:00Z')[0]).toMatchObject({ originalTitle: 'Fed & rates', originalSummary: 'Policy statement' });
  });
  it('returns structured source errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchNewsSource(source, '2026-09-14T10:17:00Z', fetchImpl)).resolves.toMatchObject({ ok: false, items: [], error: 'HTTP 503' });
  });
});
