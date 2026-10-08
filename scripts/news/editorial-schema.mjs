const string={type:'string'};
const array=items=>({type:'array',items});
const strings={...array(string),minItems:1,maxItems:6};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const quote=object({text:string,evidence:string});
const evidence=object({facts:array(quote),background:array(quote),expectations:array(quote),uncertainties:array(quote)});
const analysis=object({language:{type:'string',enum:['zh','en']},title:string,summary:string,excerpt:string,consensus:strings,inference:strings,risks:strings,causalChain:array(object({title:string,explanation:string,condition:string})),watchItems:strings,topic:string,marketExpectationEvidence:{type:['string','null']},soWhat:object({analogy:object({image:string,explanation:string}),why:object({cause:string,mechanisms:strings,result:string}),focus:strings,marketBet:strings,expectationGap:string,counterView:string,personalImpact:array(object({label:{type:'string',enum:['投资','汇率','住房','工作','消费','企业经营']},impact:string,why:string,condition:string}))}),political:{anyOf:[{type:'null'},object({type:string,channel:string,affected:strings,watch:string,counterRisk:string})]},classification:object({analysisLevels:strings,eventTypes:strings,impactChannels:strings,regions:strings})});
analysis.properties.marketSignals={...array(object({asset:string,direction:{type:'string',enum:['上行','下行','分化','中性']},reason:string,condition:string,invalidation:string,timeframe:string})),minItems:1,maxItems:4};
analysis.required.push('marketSignals');
export function sourceExcerpts(body){
  const excerpts=[];
  for(const sentence of body.split(/(?<=[。！？\n])/u)){
   if(sentence.length<=120){if(sentence.trim().length>=6) excerpts.push(sentence.trim());}
   else for(let start=0;start<sentence.length;start+=70){const part=sentence.slice(start,start+120).trim();if(part.length>=6) excerpts.push(part);}
  }
  return Object.fromEntries([...new Set(excerpts)].map((text,index)=>[`E${index+1}`,text]));
}
export function editorialResponseFormat(stage,body=''){
 let evidenceSchema=evidence;
 if(stage==='evidence'&&body){
  const ids=Object.keys(sourceExcerpts(body));
  if(ids.length){const boundQuote=object({text:string,evidence:{type:'string',enum:ids}});evidenceSchema=object({facts:array(boundQuote),background:array(boundQuote),expectations:array(boundQuote),uncertainties:array(boundQuote)});}
 }
 return {type:'json_schema',json_schema:{name:`editorial_${stage}`,strict:true,schema:stage==='evidence'?evidenceSchema:stage==='audit'?object({approved:{type:'boolean'}}):analysis}};
}
