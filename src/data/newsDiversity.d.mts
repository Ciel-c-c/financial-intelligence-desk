export interface DiscoveryNews {sourceName?:string;sourceId?:string;originalTitle?:string;originalSummary?:string;publishedAt?:string;id?:string;canonicalUrl?:string;importanceScore?:number;verificationStatus?:string}
export function publisherFamily(item:DiscoveryNews):string;
export function orderDiverseNews<T extends DiscoveryNews>(items:readonly T[],now?:string):T[];
