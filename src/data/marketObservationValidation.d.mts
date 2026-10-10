import type {MarketInstrument} from './siteSnapshotTypes';
export const MARKET_TIME_ZONES: Record<string,string>;
export function dateInZone(value:string,timeZone:string):string;
export function validTradingDate(value:unknown):boolean;
export function validateObservation(value:unknown,now?:string): value is MarketInstrument;
