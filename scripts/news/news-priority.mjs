// Discovery priority only. This never determines asset direction or personal impacts.
export function economicNewsPriority(record){
 const text=`${record.originalTitle??''} ${record.originalSummary??''}`;
 const macro=/\b(?:inflation|interest rates?|yields?|central bank|tariffs?|sanctions?|trade deal|gdp|unemployment|federal reserve|cpi|oil|gas|electricity|shipping|supply chain|exports?|imports?|mortgages?|national security|military|wars?|conflicts?|energy supply)\b|央行|利率|通胀|关税|制裁|经济数据|就业数据|油价|债市|货币政策|财政政策|地缘冲突/i.test(text);
 const company=/\b(?:stocks?|shares?|earnings|profits?|revenues?|guidance|ceo|chief .{0,25}officer|acquisition|merger|layoffs?|ipo|semiconductors?|ai)\b|股价|业绩|盈利|营收|并购|上市|裁员|人工智能|芯片|管理层/i.test(text);
 const largeMove=company&&[...text.matchAll(/(?:\b|\s)(\d+(?:\.\d+)?)\s*%/g)].some(match=>Number(match[1])>=10);
 return (macro?30:0)+(company?20:0)+(largeMove?40:0);
}
