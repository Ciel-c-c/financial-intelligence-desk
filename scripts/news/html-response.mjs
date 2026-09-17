import {TextDecoder} from 'node:util';
export async function readHtmlResponse(response) {
 if(typeof response.arrayBuffer!=='function') return response.text();
 const bytes=new Uint8Array(await response.arrayBuffer());
 const preview=new TextDecoder('latin1').decode(bytes.slice(0,4096));
 const charset=response.headers?.get?.('content-type')?.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]
  ??preview.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]??'utf-8';
 if(!['utf-8','utf8','gbk','gb2312','gb18030'].includes(charset.toLowerCase())) throw new Error('Unsupported publisher charset');
 return new TextDecoder(charset.toLowerCase().startsWith('gb')?'gb18030':'utf-8',{fatal:true}).decode(bytes);
}
