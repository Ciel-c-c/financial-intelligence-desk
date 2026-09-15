import { parseNewsFeed } from './feed-parser.mjs';
import { validateRegisteredSource } from './source-registry.mjs';
export async function fetchNewsSource(source, fetchedAt, fetchImpl=fetch) {
  try {
    if (!validateRegisteredSource(source, fetchedAt)) throw new Error('Source has not passed registration verification');
    const response = await fetchImpl(source.feedUrl, { headers:{ accept:'application/rss+xml, application/atom+xml, application/xml, text/xml', 'user-agent':'Financial-Lens-News/1.0 (+https://github.com/Ciel-c-c/financial-intelligence-desk)' }, signal:AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = parseNewsFeed(await response.text(), source, fetchedAt).slice(0,50);
    if (!items.length) throw new Error('Feed contained no usable items');
    return { id:source.id, name:source.name, ok:true, items };
  } catch (error) { return { id:source.id, name:source.name, ok:false, items:[], error:error instanceof Error ? error.message:String(error) }; }
}
