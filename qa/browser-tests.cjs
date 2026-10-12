// Run with: node qa/browser-tests.cjs. Requires Playwright and Chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.KNIL_TEST_URL||'http://127.0.0.1:8765/';
const output=path.join(__dirname,'screenshots');fs.mkdirSync(output,{recursive:true});
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
async function main(){
  const proxy=process.env.HTTPS_PROXY||process.env.https_proxy||process.env.HTTP_PROXY||process.env.http_proxy;
  const browser=await chromium.launch({executablePath:process.env.KNIL_CHROMIUM||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox'],proxy:proxy?{server:proxy,bypass:'127.0.0.1,localhost'}:undefined});
  const errors=[];
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  check(await page.evaluate(()=>KNIL_APP.events.length===41),'Complete timeline loads');
  check(await page.locator('.event').count()===41,'41 event rows');
  // Every event renders its own sources, including events without a map point.
  const ids=await page.evaluate(()=>KNIL_APP.events.map(e=>e.id));
  for(const id of ids){
    await page.evaluate(id=>KNIL_APP.select(KNIL_APP.events.find(e=>e.id===id)),id);
    await page.locator('[data-tab="sources"]').click();
    const expected=await page.evaluate(id=>KNIL_APP.events.find(e=>e.id===id).source_ids,id);
    const actual=await page.locator('[data-source-id]').evaluateAll(rows=>rows.map(r=>r.dataset.sourceId));
    check(JSON.stringify(actual)===JSON.stringify(expected),id+' precise source links');
    check(await page.locator('#dt').textContent(),id+' title renders');
  }
  await page.locator('#allRoute').click();await page.waitForTimeout(150);
  for(const topic of ['personal','military','occupation','independence','voyage','netherlands']){
    await page.locator('#phaseFilter').selectOption(topic);
    const state=await page.evaluate(()=>({visible:KNIL_APP.visible.length,rows:[...document.querySelectorAll('.event')].filter(r=>!r.hidden).length,markers:KNIL_APP.markerGroup.getLayers().length,expected:KNIL_APP.visible.filter(e=>KNIL_APP.markers.has(e.id)).length}));
    check(state.visible>0&&state.visible===state.rows,topic+' list filter');check(state.markers===state.expected,topic+' marker filter');
  }
  await page.locator('#phaseFilter').selectOption('');
  for(const level of ['A','B','C','D']){
    await page.locator('#evidenceFilter').selectOption(level);check(await page.evaluate(level=>KNIL_APP.visible.length>0&&KNIL_APP.visible.every(e=>e.evidence_level===level),level),level+' evidence filter');
  }
  await page.locator('#evidenceFilter').selectOption('');
  await page.locator('#pointSearch').fill('E015');await page.locator('[data-event-id="E015"]').click();
  check(await page.locator('#dt').textContent().then(t=>t.includes('XXIe')),'Correct battalion');check(await page.locator('#dd').textContent().then(t=>t.includes('24 september')),'Preferred original date');
  check(await page.locator('#prevPoint').isDisabled()&&await page.locator('#nextPoint').isDisabled(),'Navigation follows filtered list');
  await page.locator('[data-tab="context"]').click();check(await page.locator('#extraContext').textContent().then(t=>t.includes('14sep')),'Conflicting reading preserved');
  await page.locator('#allRoute').click();await page.waitForTimeout(200);
  await page.locator('#confirmedOnly').check();check(await page.evaluate(()=>KNIL_APP.visible.every(e=>e.status==='bevestigd')),'Confirmed-only filter');
  await page.locator('#confirmedOnly').uncheck();await page.locator('#pointSearch').fill('zzzzzz');check(await page.evaluate(()=>KNIL_APP.visible.length===0&&KNIL_APP.markerGroup.getLayers().length===0),'Empty results clear markers');
  await page.locator('#allRoute').click();await page.waitForTimeout(200);
  check(await page.evaluate(()=>KNIL_APP.voyageRoute.some(([lat,lng])=>lat>29&&lat<32&&lng>32&&lng<33)),'Suez-oriented presumed voyage');
  await page.locator('#pointSearch').fill('E035');await page.locator('[data-event-id="E035"]').click();
  check(await page.evaluate(()=>!KNIL_APP.markers.has('E035')),'No fabricated Laarbrug marker');check(await page.locator('#locationNote').textContent().then(t=>t.includes('Geen voldoende')),'Unknown location explanation');
  await page.locator('#allRoute').click();await page.waitForTimeout(200);
  await page.evaluate(()=>KNIL_APP.select(KNIL_APP.events.find(e=>e.id==='E022')));await page.waitForTimeout(250);
  await page.locator('[data-tab="sources"]').click();await page.locator('[data-source-image="S03"]').click();
  await page.locator('#bigImg').evaluate(img=>img.decode());
  check(await page.locator('#modalClose').evaluate(e=>e===document.activeElement),'Modal focuses close button');
  await page.locator('#zoomNative').click();const native=await page.locator('#bigImg').evaluate(img=>img.getBoundingClientRect().width);
  await page.locator('#zoomIn').click();check(await page.locator('#bigImg').evaluate(img=>img.getBoundingClientRect().width)>native,'Zoom grows image');
  await page.locator('#zoomFit').click();check(await page.locator('#imageScroll').evaluate(el=>el.classList.contains('fit')),'Fit restores image');
  await page.keyboard.press('Escape');check(!await page.locator('#sourceModal').evaluate(e=>e.classList.contains('open')),'Escape closes modal');
  check(await page.locator('[data-source-image="S03"]').evaluate(e=>e===document.activeElement),'Focus restored');
  await page.locator('[data-tab="context"]').click();await page.locator('#detail').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(output,'desktop.png')});
  await page.locator('#familyStory').click();check(await page.locator('#storyText').textContent().then(t=>t.includes('Orpa')),'Family narrative');
  for(const [width,height] of [[360,740],[390,844],[430,932],[844,390]]){
    const mobile=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base,{waitUntil:'networkidle'});
    await mobile.locator('#pointsBtn').click();await mobile.locator('#pointSearch').fill('E022');await mobile.locator('[data-event-id="E022"]').click();await mobile.waitForTimeout(300);
    const state=await mobile.evaluate(()=>{
      const d=document.querySelector('#detail'),m=document.querySelector('.selected-marker'),dr=d.getBoundingClientRect(),mr=m?.getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth,detailOverflow:d.scrollWidth>d.clientWidth,visible:!!mr&&mr.left>=0&&mr.right<=innerWidth&&mr.top>=document.querySelector('.top').getBoundingClientRect().bottom&&mr.bottom<=innerHeight&&(dr.width<innerWidth*.9?mr.right<=dr.left:mr.bottom<=dr.top),selected:document.querySelectorAll('.selected-marker').length};
    });
    check(!state.overflow&&!state.detailOverflow,`${width}x${height} no overflow`);check(state.visible&&state.selected===1,`${width}x${height} marker accessible`);
    await mobile.locator('[data-tab="sources"]').click();await mobile.locator('[data-source-image="S03"]').click();await mobile.locator('#bigImg').evaluate(img=>img.decode());check(await mobile.locator('#modalClose').isVisible(),'Mobile source viewer');await mobile.keyboard.press('Escape');
    await mobile.locator('[data-tab="context"]').click();await mobile.locator('#detail').evaluate(e=>e.scrollTop=0);if(width===390||width===844)await mobile.screenshot({path:path.join(output,width===390?'mobile.png':'landscape.png')});
    await mobile.locator('#sheetSize').click();check(await mobile.locator('#sheetSize').getAttribute('aria-expanded')==='true','Expanded reading panel');
    await mobile.close();
  }
  const broken=await page.locator('img[src]:not(.leaflet-tile)').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));check(broken.length===0,'No broken loaded source images: '+broken.join(', '));
  const tileState=await page.locator('.leaflet-tile').evaluateAll(imgs=>({loaded:imgs.filter(i=>i.complete&&i.naturalWidth).length,failed:imgs.filter(i=>i.complete&&!i.naturalWidth).length}));
  check(errors.length===0,'No browser exceptions: '+errors.join('; '));
  fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify({base,checks,errors,passed:true,tileState},null,2));
  console.log(`PASS: ${checks} browser assertions; all events, filters, sources, map selection, Suez route, modal, keyboard, desktop and four mobile viewports.`);await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
