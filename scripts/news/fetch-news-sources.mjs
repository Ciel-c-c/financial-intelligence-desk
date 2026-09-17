import { parseNewsFeed } from './feed-parser.mjs';
import { validateRegisteredSource } from './source-registry.mjs';
import { fetchFullArticle } from './full-article.mjs';
import { parseChineseIndex } from './chinese-index.mjs';
import {parseThsIndex} from './ths-articles.mjs';
import {readHtmlResponse} from './html-response.mjs';
export async function fetchNewsSource(source, fetchedAt, fetchImpl=fetch) {
  try {
    if (!validateRegisteredSource(source, fetchedAt)) throw new Error('Source has not passed registration verification');
    const response = await fetchImpl(source.feedUrl, { headers:{ accept:'application/rss+xml, application/atom+xml, application/xml, text/xml', 'user-agent':'Financial-Lens-News/1.0 (+https://github.com/Ciel-c-c/financial-intelligence-desk)' }, signal:AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html=await readHtmlResponse(response);
    const parsed = (source.parser==='ths-index'?parseThsIndex(html,source,fetchedAt):source.parser==='html-index'?parseChineseIndex(html,source,fetchedAt):parseNewsFeed(html,source,fetchedAt)).slice(0,50);
    const items=[];
    // Bound article requests, and keep original dates. Other publishers remain
    // feed-only until both a permitted body reader and complete review exist.
    for(const item of parsed){const article=items.length<12?await fetchFullArticle(item,source,fetchedAt,fetchImpl):undefined;items.push({...item,...(article?{article}:{})});}
    if (!items.length) throw new Error('Feed contained no usable items');
    return { id:source.id, name:source.name, ok:true, items };
  } catch (error) { return { id:source.id, name:source.name, ok:false, items:[], error:error instanceof Error ? error.message:String(error) }; }
}
