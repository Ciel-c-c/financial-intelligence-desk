import {expect,it} from 'vitest';
import {globalSituationFromFeed} from '../../src/data/useGlobalSituation';
import {newsFeedSeed} from '../../src/data/newsFeedSeed';
import {reviewedItem} from '../fixtures/reviewedFeed';
it.each(['source_error','delayed'] as const)('does not call a recent publication freshly verified when feed status is %s',status=>{
 const publishedAt=new Date().toISOString();
 const item={...reviewedItem,publishedAt,editorial:{...reviewedItem.editorial!,item:{...reviewedItem.editorial!.item,publishedAt}}};
 const result=globalSituationFromFeed({...newsFeedSeed,status,latest:[item]});
 expect(result.events).toHaveLength(1);
 expect(result.status).toBe(status);
});
