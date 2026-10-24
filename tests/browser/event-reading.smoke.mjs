import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const bundled=path.join(process.env.USERPROFILE??'', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const require=createRequire(import.meta.url);let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=createRequire(bundled)('playwright'));}
const base=process.env.EVENT_PREVIEW_URL??'http://127.0.0.1:5187/';
const out=path.resolve('docs/operations/event-reading-phase2');await fs.mkdir(out,{recursive:true});
const events=JSON.parse(await fs.readFile('src/data/worldEvents/events.json','utf8'));
const feed=JSON.parse(await fs.readFile('public/data/news-feed.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_EXECUTABLE??'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'zh-CN',reducedMotion:'reduce'});
const page=await context.newPage();const results=[],errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
const check=(name,pass,details)=>{results.push({name,pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
async function shot(name,selector){if(selector)await page.locator(selector).evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-82));await page.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:80});}
async function overflow(name){const r=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));check('No horizontal overflow: '+name,r.document===390&&r.body===390,r);}
async function pressed(label){await page.locator('button[aria-label="'+label+'路径"][aria-pressed=true]').waitFor();}
try{
 const begin=Date.now();await page.goto(base,{waitUntil:'networkidle',timeout:20000});
 await page.locator('.live-news-feed .news-card').first().waitFor({timeout:15000});
 check('Real committed news still visible',(await page.locator('.live-news-feed .news-card').count())>0);
 check('Five historical cards, four basic',await page.locator('.world-event-card').count()===5&&(await page.locator('.world-event-meta').allTextContents()).filter(t=>t.includes('基础解读')).length===4);
 check('Historical cards not inside real-time news',await page.locator('.live-news-feed .world-event-card').count()===0);
 check('Home first usable duration recorded',true,{milliseconds:Date.now()-begin});
 await overflow('home');await shot('390-home');await shot('390-live-news','.live-news-feed');
 const newsLink=page.locator('.live-news-feed .news-card a[href*="/news/"]').first();await newsLink.tap();
 await page.getByRole('heading',{level:1}).waitFor();check('Live news detail opens',page.url().includes('/news/')&&await page.getByRole('link',{name:/查看原始来源/}).count()>0);
 await page.getByRole('link',{name:/返回今日/}).first().tap();await page.locator('.world-event-card').first().waitFor();
 for(const e of events){
  await page.locator('.world-event-card[href="#/events/'+e.id+'"]').tap();await page.getByRole('heading',{level:1,name:e.question}).waitFor();
  check('Event opens: '+e.id,await page.getByRole('heading',{level:1,name:e.question}).isVisible());
  check('Historical marker: '+e.id,(await page.locator('.p-event-head').innerText()).includes('历史案例'));
  check('Situation quiz available: '+e.id,await page.locator('.p-quiz').count()===1);
  await overflow(e.id);
  if(e.id!=='el-nino-2023')check('Basic story retains full narrative: '+e.id,(await page.locator('.event-claim').count())>=6);
  await page.getByRole('link',{name:'返回资讯',exact:false}).first().tap();await page.locator('.world-event-card').first().waitFor();
 }
 await page.locator('.world-event-card[href="#/events/el-nino-2023"]').tap();await page.getByRole('heading',{level:1}).waitFor();await shot('390-el-nino');
 await page.getByText('为什么海水会影响天气？',{exact:true}).tap();await page.locator('details.event-section[open]').first().waitFor();check('Background disclosure opens',await page.getByText(/平时信风把暖水/).isVisible());
 await page.getByRole('button',{name:'农业路径'}).tap();await pressed('农业');
 await page.getByRole('button',{name:/总供应还要算库存/}).tap();await page.getByRole('button',{name:/总供应还要算库存/}).locator('xpath=..').locator('.p-node-body').waitFor();
 await page.getByRole('button',{name:'能源路径'}).tap();await pressed('能源');check('Energy evidence boundary visible',await page.getByText(/未提供特定电站/).isVisible());
 await page.getByRole('button',{name:'运输路径'}).tap();await pressed('运输');await page.getByRole('button',{name:/排队、少装或绕行/}).tap();
 await page.getByRole('button',{name:'农业路径'}).tap();await pressed('农业');check('Agriculture retains selected node',(await page.getByRole('button',{name:/总供应还要算库存/}).getAttribute('aria-expanded'))==='true');
 await page.getByRole('button',{name:'运输路径'}).tap();await pressed('运输');check('Transport retains its own node',(await page.getByRole('button',{name:/排队、少装或绕行/}).getAttribute('aria-expanded'))==='true');
 await shot('390-branches','#event-explore');await overflow('branch switching');
 await page.getByRole('button',{name:'展开概念：供给与价格'}).tap();await page.getByRole('link',{name:'学习课程：供需与均衡价格'}).waitFor();await shot('390-concept','#event-concepts');
 const beforeUrl=page.url();const course=page.getByRole('link',{name:'学习课程：供需与均衡价格'});await course.scrollIntoViewIfNeeded();const savedY=await page.evaluate(()=>scrollY);
 await course.tap();await page.getByRole('heading',{level:1,name:'供需与均衡价格'}).waitFor();check('Original course and self-test retained',await page.getByRole('button',{name:'查看答案',exact:true}).count()===1);
 await page.getByRole('checkbox',{name:'标记已学会'}).check();await page.reload({waitUntil:'networkidle'});check('Existing learning progress survives reload',await page.getByRole('checkbox',{name:'标记已学会'}).isChecked());
 await page.getByRole('button',{name:'查看答案',exact:true}).tap();await page.locator('.quiz-answer').waitFor();check('Existing course quiz operates',await page.locator('.quiz-answer').isVisible());await overflow('original course');
 await page.getByRole('link',{name:'返回事件，继续探索',exact:true}).tap();await page.getByRole('button',{name:'收起概念：供给与价格'}).waitFor();await page.waitForTimeout(180);
 check('Course return restores URL, branch and concept',page.url()===beforeUrl,page.url());check('Course return keeps background disclosure open',await page.getByText(/平时信风把暖水/).isVisible());const returnedY=await page.evaluate(()=>scrollY);check('Course return restores reading position',Math.abs(savedY-returnedY)<=8,{savedY,returnedY});
 await page.getByRole('link',{name:'学习课程：供需与均衡价格'}).tap();await page.getByRole('heading',{level:1,name:'供需与均衡价格'}).waitFor();await page.goBack();await page.getByRole('button',{name:'收起概念：供给与价格'}).waitFor();check('Browser Back retains event state',page.url()===beforeUrl);
 await page.reload({waitUntil:'networkidle'});check('Event refresh retains selected node',(await page.getByRole('button',{name:/排队、少装或绕行/}).getAttribute('aria-expanded'))==='true');
 await page.getByRole('radio',{name:/粮价和食品公司股价一定一起涨/}).tap();await page.waitForFunction(()=>document.querySelector('input[name="event-quiz"]')?.checked);
 await page.getByRole('button',{name:'看看我的推理'}).tap();await page.getByRole('status').waitFor();check('Scenario feedback explains causal conditions',(await page.getByRole('status').textContent()).includes('库存和其他产区丰收'));await shot('390-quiz','.p-quiz');
 for(const e of events.filter(e=>e.newsLinks.some(l=>l.expectedSourceHash))){
  const link=e.newsLinks.find(l=>l.expectedSourceHash);const item=feed.latest.find(n=>n.canonicalUrl===link.canonicalUrl);await page.goto(base+'#/news/'+item.id,{waitUntil:'networkidle'});
  await page.getByRole('complementary',{name:'相关事件背景'}).waitFor();check('Exact reviewed live news links topic: '+e.id,await page.getByRole('link',{name:e.question+' →'}).isVisible());
  check('Topic link not mislabeled same event: '+e.id,(await page.getByRole('complementary',{name:'相关事件背景'}).textContent()).includes('非同一事件'));
 }
 await shot('390-news-association','.related-world-events');
 await page.locator('.bottom-nav a[href="#/learn"]').tap();await page.getByRole('searchbox',{name:'搜索知识'}).waitFor();await page.getByRole('searchbox',{name:'搜索知识'}).fill('供需');await page.locator('.subject-grid a[href="#/learn/supply-demand"]').waitFor();check('Original knowledge search retained',await page.locator('.subject-grid a[href="#/learn/supply-demand"]').isVisible());
 await page.getByRole('searchbox',{name:'搜索知识'}).fill('');await page.getByRole('combobox',{name:/学习状态/}).selectOption('learned');await page.getByRole('status').filter({hasText:'显示 1 / 30'}).waitFor();check('Learned filter retains saved progress',(await page.getByRole('status').textContent()).includes('1 / 30'));
 await page.locator('.bottom-nav a[href="#/situation"]').tap();await page.getByRole('heading',{level:1}).waitFor();check('Global situation remains available',page.url().endsWith('/situation')&&(await page.locator('main').textContent()).includes('全球'));await overflow('global situation');
 check('No market snapshot requests',!requests.some(u=>/\/(?:market-overview|market-sessions|sector-performance)\.json/.test(u)));
 check('No model service requests',!requests.some(u=>/api\.groq|api\.cerebras/.test(u)));
 check('No browser script errors',errors.length===0,errors);
}catch(error){errors.push(error.stack);await page.screenshot({path:path.join(out,'failure.png')});}
await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),browser:await browser.version(),mode:'Real Edge Chromium, mobile emulation; not physical iOS/Android',viewport:{width:390,height:844},results,errors},null,2)+'\n');console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,errors},null,2));await browser.close();if(errors.length||results.some(r=>!r.pass))process.exitCode=1;



