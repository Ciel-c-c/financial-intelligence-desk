import {expect,it} from 'vitest';
import {sourceExcerpts} from '../../scripts/news/editorial-schema.mjs';
it('does not offer meaningless trailing fragments after a previous window already covered the sentence',()=>{
 const text="Trump’s bid to fire the Fed's Lisa Cook follows a Supreme Court ruling and could affect Jerome Powell, central bank independence and interest rates.";
 const quotes=Object.values(sourceExcerpts(text));
 expect(quotes).not.toContain('t rates.');
 expect(quotes.every(q=>q.length>=30)).toBe(true);
 expect(quotes.some(q=>q.includes('central bank independence and interest rates'))).toBe(true);
});
