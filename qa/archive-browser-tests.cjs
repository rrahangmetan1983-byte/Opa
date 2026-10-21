// Exercise the source page on desktop and phone-sized browser viewports.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.KNIL_TEST_URL||'http://127.0.0.1:8765/';
async function main(){
  const browser=await chromium.launch({executablePath:process.env.KNIL_CHROMIUM,headless:true});
  let checks=0;const results=[];
  const check=(ok,msg)=>{assert.ok(ok,msg);checks++};
  for(const width of [1440,1024,390,360]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
    await page.goto(base+'research/archiefbronnen-1947.html');
    check(await page.locator('section[id^="scan-"]').count()===7,'Seven source sections');
    for(const section of await page.locator('section[id^="scan-"]').all()){
      await section.scrollIntoViewIfNeeded();
      for(const img of await section.locator('img').all()){
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(i=>i.decode());
        check(await img.evaluate(i=>i.naturalWidth>0&&i.naturalHeight>0&&!!i.alt),'Image loads and has alt text');
      }
      check(await section.locator('pre').textContent().then(t=>t.length>50),'Transcription present');
      check(await section.locator('.warning').textContent().then(t=>t.includes('Daniël')||t.includes('Daniëls')),'Personal evidence limit present');
      const popupPromise=page.waitForEvent('popup');
      await section.locator('figure').nth(1).locator('figcaption a').click();
      const popup=await popupPromise;await popup.waitForLoadState();
      check(await popup.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0),'Full resolution crop opens');
      await popup.close();
    }
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow at '+width);
    check(errors.length===0,'No browser or resource errors: '+errors.join(';'));
    await page.locator('#scan-0250').scrollIntoViewIfNeeded();
    fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
    await page.screenshot({path:path.join(__dirname,'screenshots',`archive-${width}.png`),fullPage:true});
    await page.locator('#scan-0250').evaluate(el=>el.scrollIntoView({block:'start'}));
    await page.screenshot({path:path.join(__dirname,'screenshots',`archive-detail-${width}.png`)});
    await page.locator('nav a').click();await page.waitForLoadState();
    check(await page.locator('#map').count()===1,'Return to main map works');
    results.push({width,passed:true});await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname,'archive-test-results.json'),JSON.stringify({base,checks,viewports:results,passed:true},null,2));
  console.log(`PASS: ${checks} archive assertions at 1440, 1024, 390 and 360 px.`);
}
main().catch(e=>{console.error(e);process.exit(1)});
