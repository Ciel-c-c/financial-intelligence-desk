import { readFile,writeFile,mkdir } from 'node:fs/promises'; import { dirname } from 'node:path';
export async function readEnrichmentCache(path){ try{return JSON.parse(await readFile(path,'utf8'));}catch{return {};}}
export async function writeEnrichmentCache(path,value){await mkdir(dirname(path),{recursive:true});await writeFile(path,`${JSON.stringify(value,null,2)}\n`,'utf8');}
