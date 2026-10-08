const string={type:'string'};
const array=items=>({type:'array',items});
const strings=array(string);
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const quote=object({text:string,evidence:string});
const evidence=object({facts:array(quote),background:array(quote),expectations:array(quote),uncertainties:array(quote)});
const analysis=object({language:{type:'string',enum:['zh','en']},title:string,summary:string,excerpt:string,consensus:strings,inference:strings,risks:strings,causalChain:array(object({title:string,explanation:string,condition:string})),watchItems:strings,topic:string,marketExpectationEvidence:{type:['string','null']},soWhat:object({analogy:object({image:string,explanation:string}),why:object({cause:string,mechanisms:strings,result:string}),focus:strings,marketBet:strings,expectationGap:string,counterView:string,personalImpact:array(object({label:{type:'string',enum:['投资','汇率','住房','工作','消费','企业经营']},impact:string,why:string,condition:string}))}),political:{anyOf:[{type:'null'},object({type:string,channel:string,affected:strings,watch:string,counterRisk:string})]},classification:object({analysisLevels:strings,eventTypes:strings,impactChannels:strings,regions:strings})});
export function editorialResponseFormat(stage){
 return {type:'json_schema',json_schema:{name:`editorial_${stage}`,strict:true,schema:stage==='evidence'?evidence:stage==='audit'?object({approved:{type:'boolean'}}):analysis}};
}