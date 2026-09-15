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
 const events=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].map(globalEventFromNews).filter((event):event is GlobalEvent=>!!event);
 return {schemaVersion:2,attemptedAt:snapshot.attemptedAt,lastSuccessfulAt:events.map(event=>event.fetchedAt).sort().at(-1)??null,status:snapshot.status==='source_error'?'source_error':snapshot.status==='delayed'?'delayed':events.length?(events.some(event=>isRecentNews(event.publishedAt))?'fresh':'delayed'):'unavailable',sourceHealth:snapshot.sourceHealth,events};
}
