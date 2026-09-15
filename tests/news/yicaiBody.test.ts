import {expect,it} from 'vitest';
import {fetchFullArticle,toPublicEvidence} from '../../scripts/news/full-article.mjs';
const source={id:'yicai',publisherDomains:['www.yicai.com'],articlePolicy:{pathPrefix:'/news/',bodyFormat:'yicai-body'}};
const item={canonicalUrl:'https://www.yicai.com/news/103364397.html',originalTitle:'AI安全讨论与芯片股'};
it('reads only the complete original article body, never premium AI summaries or related stories',async()=>{
 const text='报道记录多地半导体股下跌，同时区分行业安全讨论与实际资本支出变化。'.repeat(10);
 const html=`<h1>${item.originalTitle}</h1><div id="aiBox">付费AI介绍</div><div id="multi-text" class="f-cb"><p>${text}</p><p>最后一段报道。</p></div><div id="jb_report">举报</div><p>无关旧闻</p>`;
 const article=await fetchFullArticle(item,source,'2026-09-15T13:00:00Z',async url=>({ok:true,url,text:async()=>html}));
 expect(article?.text).toContain('最后一段报道');
 expect(article?.text).not.toContain('付费AI介绍');
 expect(article?.text).not.toContain('无关旧闻');
 expect(toPublicEvidence({article}).article.text).toBeUndefined();
});
