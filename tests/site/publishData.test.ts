import {expect,it} from 'vitest';
import {assertDataOnlyChanges} from '../../scripts/site/publish-data.mjs';
it('accepts only public-data paths when rebasing a generated-data commit',()=>{
 expect(()=>assertDataOnlyChanges(['public/data/news-feed.json','public/data/market-sessions.json'])).not.toThrow();
 expect(()=>assertDataOnlyChanges(['src/App.tsx'])).toThrow();expect(()=>assertDataOnlyChanges(['public/data/../index.html'])).toThrow();expect(()=>assertDataOnlyChanges(['public/dataevil/news.json'])).toThrow();
});
