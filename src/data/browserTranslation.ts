export type NativeTranslator={translate:(text:string)=>Promise<string>};
export type NativeTranslatorAPI={availability:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<string>;create:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<NativeTranslator>};
export async function createChineseTranslator(api?:NativeTranslatorAPI):Promise<NativeTranslator>{
  if(!api) throw new Error('当前浏览器不支持本机翻译，可使用浏览器菜单中的“翻译成中文”。');
  const options={sourceLanguage:'en',targetLanguage:'zh'};
  if(await api.availability(options)==='unavailable') throw new Error('当前设备不支持英文到中文的本机翻译。');
  return api.create(options);
}
export async function translatePreservingNumbers(translator:NativeTranslator,text:string){
  const result=await translator.translate(text);
  const numbers=(value:string)=>(value.match(/\d+(?:[.,]\d+)*/g)??[]).sort().join('|');
  if(!result.trim()||numbers(result)!==numbers(text)) throw new Error('译文数字与原文不一致，保留原文。');
  return result;
}
