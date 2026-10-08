import {expect,it} from 'vitest';
import {economicNewsPriority} from '../../scripts/news/news-priority.mjs';
it('prioritizes market-moving company and macro events above isolated consumer complaints',()=>{
 const complaint={originalTitle:'We paid for a cruise but ended up on coach trips',originalSummary:'Passengers describe frustration with their changed itinerary.'};
 expect(economicNewsPriority({originalTitle:'Webull shares plunge after congressional panel raises concerns',originalSummary:'The company disputes a report about regulatory risks.'})).toBeGreaterThan(economicNewsPriority(complaint));
 expect(economicNewsPriority({originalTitle:'Lululemon appoints new chief product officer',originalSummary:'The executive previously led Athleta as CEO.'})).toBeGreaterThan(economicNewsPriority(complaint));
 expect(economicNewsPriority({originalTitle:'央行调整利率，企业融资成本可能变化'})).toBeGreaterThan(economicNewsPriority(complaint));
});
