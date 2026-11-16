import {findWorldEvent} from './registry';
export function safeEventReturn(value:string|null):string|undefined {
 if(!value||!/^\/events\/[-a-z0-9]+(?:\?[^#]*)?$/.test(value))return;
 try{const url=new URL(value,'https://local.invalid');if(url.origin!=='https://local.invalid'||!findWorldEvent(url.pathname.slice('/events/'.length)))return;return url.pathname+url.search;}catch{return;}
}
export function saveEventPosition(returnTo:string):void {if(!safeEventReturn(returnTo))return;try{sessionStorage.setItem('fid-event-position:'+returnTo,String(window.scrollY));}catch{/* Reading does not depend on storage. */}}
export function loadEventPosition(returnTo:string):number {try{const y=Number(sessionStorage.getItem('fid-event-position:'+returnTo));return Number.isFinite(y)&&y>=0?y:0;}catch{return 0;}}
