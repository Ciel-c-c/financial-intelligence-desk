import {expect,it} from 'vitest';
import {newsSources} from '../../scripts/news/source-registry.mjs';
import {buildSourcePolicies,isSourceAllowed} from '../../scripts/news/source-policy.mjs';
const now='2026-10-09T14:00:00Z';
it('allows reviewed article paths and rejects impersonated or non-article URLs',()=>{
 const policies=buildSourcePolicies(newsSources,now);
 const record={sourceId:'cnbc-markets',sourceTier:'verified',canonicalUrl:'https://www.cnbc.com/2026/10/09/ai-ipo.html'};
 expect(isSourceAllowed(record,policies,now)).toBe(true);
 for(const url of ['https://www.cnbc.com.evil.test/2026/10/09/a.html','http://www.cnbc.com/2026/10/09/a.html','https://www.cnbc.com/id/100003114/device/rss/rss.html']) expect(isSourceAllowed({...record,canonicalUrl:url},policies,now)).toBe(false);
 expect(isSourceAllowed({...record,sourceId:'unknown'},policies,now)).toBe(false);
});
it('does not infer source-summary redistribution permission from a familiar publisher name',()=>{
 const source=newsSources.find(s=>s.id==='cnbc-markets');
 const policies=buildSourcePolicies([{...source,usagePolicy:undefined}],now);
 expect(policies).toEqual([]);
 const reviewed=buildSourcePolicies([source],now)[0];
 expect(reviewed.summaryMode).toBe('model-only');
 expect(Object.keys(reviewed).sort()).toEqual(['allowedHosts','allowedPathPatterns','expiresAt','id','summaryMode','tier','verifiedAt'].sort());
});
it('rejects expired policies and accepts only the reviewed publisher hosts',()=>{
 const policies=buildSourcePolicies(newsSources,now);
 expect(isSourceAllowed({sourceId:'cnbc-markets',sourceTier:'verified',canonicalUrl:'https://www.cnbc.com/2026/10/09/a.html'},policies,'2027-01-10T00:00:00Z')).toBe(false);
 expect(isSourceAllowed({sourceId:'bbc-world',sourceTier:'verified',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc123'},policies,now)).toBe(true);
 expect(isSourceAllowed({sourceId:'bbc-world',sourceTier:'verified',canonicalUrl:'https://support.bbc.co.uk/privacy'},policies,now)).toBe(false);
});
