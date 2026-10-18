import {isGlobalNews} from './globalNews';
import {presentNews} from './newsPresentation';
import { useNewsFeed } from './useNewsFeed';
import { globalEventFromNews } from './globalFromNews';
import { isRecentNews } from './newsDates';
import type { GlobalEvent,GlobalSituationSnapshot } from './globalSituationTypes';
import type { NewsFeedSnapshot } from './newsFeedTypes';
export function useGlobalSituation():GlobalSituationSnapshot{
 const {snapshot}=useNewsFeed();
 return globalSituationFromFeed(snapshot);
}
export function globalSituationFromFeed(snapshot:NewsFeedSnapshot):GlobalSituationSnapshot{
 const thematic=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].filter(isGlobalNews).filter(item=>presentNews(item));
 const events=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].map(globalEventFromNews).filter((event):event is GlobalEvent=>!!event);
 return {schemaVersion:2,attemptedAt:snapshot.attemptedAt,nextExpectedAt:snapshot.nextExpectedAt,lastSuccessfulAt:thematic.length?snapshot.lastSuccessfulAt||null:null,status:snapshot.status==='source_error'?'source_error':snapshot.status==='delayed'?'delayed':thematic.length?(thematic.some(item=>isRecentNews(item.publishedAt))?'fresh':'delayed'):'unavailable',sourceHealth:snapshot.sourceHealth,events};
}
