// Discovery priority only. This never determines asset direction or personal impacts.
export function economicNewsPriority(record){
 const text=`${record.originalTitle??''} ${record.originalSummary??''}`;
 const macro=/\b(?:inflation|interest rates?|yields?|central bank|tariffs?|sanctions?|trade deal|gdp|unemployment|federal reserve|cpi|oil|gas|electricity|shipping|supply chain|exports?|imports?|mortgages?|energy supply)\b|央行|利率|通胀|关税|制裁|经济数据|就业数据|油价|债市|货币政策|财政政策|地缘冲突/i.test(text);
 const company=/\b(?:stocks?|shares?|earnings|profits?|revenues?|guidance|ceo|chief .{0,25}officer|acquisition|merger|layoffs?|ipo|semiconductors?|ai)\b|股价|业绩|盈利|营收|并购|上市|裁员|人工智能|芯片|管理层/i.test(text);
 const pricedMoves=[...text.matchAll(/(?:shares?|stocks?|股价|股市).{0,45}?(?:plung\w*|drop\w*|fell|fall\w*|surg\w*|jump\w*|rose|ris\w*|gain\w*|lost|tumbl\w*|跌|涨).{0,12}?(\d+(?:\.\d+)?)\s*[%％]/gi)];
 const largeMove=pricedMoves.some(match=>Number(match[1])>=10);
 const withdrawnIpo=/\b(?:withdraw\w*|scrap\w*|shelv\w*|cancel\w*|abandon\w*).{0,40}\bipo\b|\bipo\b.{0,40}\b(?:withdraw\w*|scrap\w*|shelv\w*|cancel\w*|abandon\w*)|(?:撤回|取消|暂停).{0,12}(?:IPO|上市)/i.test(text);
 return (macro?30:0)+(company?20:0)+(largeMove||withdrawnIpo?40:0);
}
