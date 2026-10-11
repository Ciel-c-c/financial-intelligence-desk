// UTC equivalents of 08:17, 12:17 and 20:17 Asia/Shanghai.
export function nextNewsEdition(now){
 const time=Date.parse(now);if(!Number.isFinite(time))throw new Error('Invalid news schedule time');
 const start=new Date(time);start.setUTCHours(0,0,0,0);
 for(const hour of [0,4,12,24]){
  const candidate=start.getTime()+(hour*60+17)*60_000;
  if(candidate>time)return new Date(candidate).toISOString();
 }
}
