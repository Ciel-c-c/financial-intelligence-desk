import reviewed from './reviewed-news.json';
import { newsFeedSeed } from '../../src/data/newsFeedSeed';
import type { LiveNewsItem } from '../../src/data/newsFeedTypes';
export const reviewedItem=reviewed.items[0] as unknown as LiveNewsItem;
export const reviewedSnapshot={...newsFeedSeed,status:'fresh' as const,latest:[],continuing:[],retainedDetails:[reviewedItem]};
export const reviewedFetch=async(request:string)=>({ok:true,json:async()=>request==='./data/reviewed-news.json'?reviewed:request==='./data/news-feed.json'?reviewedSnapshot:{}});
