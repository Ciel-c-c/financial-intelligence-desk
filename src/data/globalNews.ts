import type {LiveNewsItem} from './newsFeedTypes';
/** Topic selection uses supplied metadata and explicit subject words, never generated market impact. */
export function globalThemes(item:LiveNewsItem):string[] {
 const text=[item.originalTitle,item.originalSummary,item.titleZh,item.summaryZh].filter(Boolean).join(' ');
 const themes:string[]=item.eventTypes.filter(type=>['货币政策','财政政策','监管','贸易','经济数据','地缘风险'].includes(type));
 const rules:[string,RegExp][]=[
 ['国际关系',/制裁|外交|国际关系|双边|峰会|sanctions?|diploma(?:t|cy)|bilateral|summit/i],
 ['地缘风险',/战争|停火|冲突|入侵|地缘|war\b|ceasefire|conflict|invasion|geopolitic/i],
 ['货币政策',/央行|美联储|利率决议|central bank|federal reserve|monetary policy|interest rate/i],
 ['财政政策',/财政|政府预算|fiscal policy|government budget/i],
 ['贸易',/关税|贸易|tariffs?|trade (?:policy|deal|war|agreement)/i],
 ['经济数据',/通胀|失业率|国内生产总值|经济增长|inflation|unemployment|\bGDP\b|economic growth/i],
 ['监管',/监管|立法|regulat(?:ion|or|ory)|legislation/i]];
 for(const [theme,pattern] of rules)if(pattern.test(text))themes.push(theme);
 if(item.analysisLevels.includes('宏观')&&!themes.length)themes.push('经济数据');
 return [...new Set(themes)];
}
export function isGlobalNews(item:LiveNewsItem):boolean{return globalThemes(item).length>0;}
