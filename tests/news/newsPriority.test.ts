import {expect,it} from 'vitest';
import {economicNewsPriority} from '../../scripts/news/news-priority.mjs';
it('prioritizes market-moving company and macro events above isolated consumer complaints',()=>{
 const complaint={originalTitle:'We paid for a cruise but ended up on coach trips',originalSummary:'Passengers describe frustration with their changed itinerary.'};
 expect(economicNewsPriority({originalTitle:'Webull shares plunge after congressional panel raises concerns',originalSummary:'The company disputes a report about regulatory risks.'})).toBeGreaterThan(economicNewsPriority(complaint));
 expect(economicNewsPriority({originalTitle:'Lululemon appoints new chief product officer',originalSummary:'The executive previously led Athleta as CEO.'})).toBeGreaterThan(economicNewsPriority(complaint));
 expect(economicNewsPriority({originalTitle:'央行调整利率，企业融资成本可能变化'})).toBeGreaterThan(economicNewsPriority(complaint));
});
it('gives exceptional stock moves and withdrawn AI IPOs priority over routine company notices',()=>{
 const routine={originalTitle:'Company appoints a new chief product officer'};
 expect(economicNewsPriority({originalTitle:'Webull shares plunge 15% amid regulatory concerns'})).toBeGreaterThan(economicNewsPriority(routine));
 expect(economicNewsPriority({originalTitle:'Nvidia-backed AI firm withdraws IPO amid valuation concerns'})).toBeGreaterThan(economicNewsPriority(routine));
});
it('does not confuse a reported profit percentage with a large stock move',()=>{
 expect(economicNewsPriority({originalTitle:'Company profits grew 40%'})).toBe(economicNewsPriority({originalTitle:'Company profits grew strongly'}));
});
it('requires an economic channel before treating a military notice as economic priority',()=>{
 expect(economicNewsPriority({originalTitle:'Military aircraft carrier returns to port after deployment'})).toBe(0);
 expect(economicNewsPriority({originalTitle:'Military conflict threatens oil shipping supplies'})).toBeGreaterThan(0);
});
