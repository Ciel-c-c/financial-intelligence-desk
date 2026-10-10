const string={type:'string'};
const array=items=>({type:'array',items});
const strings={...array(string),minItems:1,maxItems:6};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const quote=object({text:string,evidence:string});
const evidence=object({facts:array(quote),background:array(quote),expectations:array(quote),uncertainties:array(quote)});
const analysis=object({language:{type:'string',enum:['zh','en']},title:string,summary:string,excerpt:string,consensus:strings,inference:strings,risks:strings,causalChain:array(object({title:string,explanation:string,condition:string})),watchItems:strings,topic:string,marketExpectationEvidence:{type:['string','null']},soWhat:object({analogy:object({image:string,explanation:string}),why:object({cause:string,mechanisms:strings,result:string}),focus:strings,marketBet:strings,expectationGap:string,counterView:string,personalImpact:array(object({label:{type:'string',enum:['投资','汇率','住房','工作','消费','企业经营']},impact:string,why:string,condition:string}))}),political:{anyOf:[{type:'null'},object({type:string,channel:string,affected:strings,watch:string,counterRisk:string})]},classification:object({analysisLevels:strings,eventTypes:strings,impactChannels:strings,regions:strings})});
analysis.properties.marketSignals={...array(object({asset:string,direction:{type:'string',enum:['上行','下行','分化','中性']},reason:string,condition:string,invalidation:string,timeframe:string})),minItems:0,maxItems:4};
analysis.required.push('marketSignals');
const personalSchema=analysis.properties.soWhat.properties.personalImpact.items;
analysis.properties.impactAssessment=array(object({label:{type:'string',enum:['投资','汇率','住房','工作','消费','企业经营']},score:{type:'integer',minimum:0,maximum:3},audience:{type:'string',enum:['households','firms','investors','workers','none']},region:string,triggerEvidence:{type:['string','null']},path:array(string),invalidation:string}));
analysis.required.push('impactAssessment');
personalSchema.properties.invalidation={type:'string',description:'Specific condition under which this personal impact DOES NOT occur or is reversed; never the condition that makes it happen.'};
delete personalSchema.properties.condition;
personalSchema.required=Object.keys(personalSchema.properties);
export function sourceExcerpts(body){
  const excerpts=[];
  for(const sentence of body.split(/(?<=[。！？\n])/u)){
   if(sentence.length<=120){if(sentence.trim().length>=6) excerpts.push(sentence.trim());}
   else for(let offset=0;offset<sentence.length;offset+=70){
    let start=offset,end=Math.min(start+120,sentence.length);
    const word=char=>char!==undefined&&/[A-Za-z0-9]/.test(char);
    while(start>0&&word(sentence[start])&&word(sentence[start-1]))start--;
    end=Math.min(start+120,sentence.length);
    while(end<sentence.length&&end>start&&word(sentence[end-1])&&word(sentence[end]))end--;
    const part=sentence.slice(start,end).trim();if(part.length>=6)excerpts.push(part);
    if(end===sentence.length)break;
   }
  }
  return Object.fromEntries([...new Set(excerpts)].map((text,index)=>[`E${index+1}`,text]));
}
export function editorialResponseFormat(stage,body='',triggerIds=[]){
 let evidenceSchema=evidence;
 if(stage==='evidence'&&body){
  const ids=Object.keys(sourceExcerpts(body));
  if(ids.length){const boundQuote=object({text:string,evidence:{type:'string',enum:ids}});evidenceSchema=object({facts:array(boundQuote),background:array(boundQuote),expectations:array(boundQuote),uncertainties:array(boundQuote)});}
 }
 const audit=object({approved:{type:'boolean'},facts:array({type:'boolean'}),causalEdges:array({type:'boolean'}),personalImpacts:array({type:'boolean'}),scenariosAreConditional:{type:'boolean'},findings:array(object({category:{type:'string',enum:['fact-evidence','translation','parallel-cause','causal-gap','expectation-attribution','impact-scope','invalidation']},section:{type:'string',enum:['facts','causalEdges','personalImpacts','expectations','scenarios']},index:{type:'integer',minimum:0,maximum:19}}))});
 const boundAnalysis=structuredClone(analysis);
 if(triggerIds.length)boundAnalysis.properties.impactAssessment.items.properties.triggerEvidence={anyOf:[{type:'null'},{type:'string',enum:triggerIds}]};
 return {type:'json_schema',json_schema:{name:`editorial_${stage}`,strict:true,schema:stage==='evidence'?evidenceSchema:stage==='audit'?audit:boundAnalysis}};
}
export function factualSummaryResponseFormat(body,audit=false){
 const schema=audit?object({approved:{type:'boolean'},facts:array({type:'boolean'}),title:{type:'boolean'},summary:{type:'boolean'},preservesMeaning:{type:'boolean'}}):object({title:{type:'string',description:'Chinese factual headline; translated proper names are allowed.'},summary:{type:'string',description:'Chinese factual paragraph of 40-400 characters, not just a repeated headline. Only report source facts; do not invent facts to meet the length.'},facts:array(object({text:{type:'string',description:'A factual paraphrase in Chinese, supported entirely by one selected fragment. Do not combine numbers from different fragments or add metadata dates.'},evidence:{type:'string',enum:Object.keys(sourceExcerpts(body)),description:'One source fragment ID, not a copied quotation.'}}))});
 return {type:'json_schema',json_schema:{name:audit?'factual_summary_audit':'factual_summary',strict:true,schema}};
}
