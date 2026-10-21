// Full interaction coverage for the approved six-part military career website.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.KNIL_TEST_URL||'http://127.0.0.1:8765/';
const output=path.join(__dirname,'screenshots');fs.mkdirSync(output,{recursive:true});
let checks=0;const check=(ok,message)=>{assert.ok(ok,message);checks++};
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.KNIL_CHROMIUM||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});
 const go=async(hash)=>{await page.evaluate(hash=>location.hash=hash,hash);await page.waitForFunction(hash=>location.hash===hash,hash);};
 const resetTimeline=async()=>{if(await page.locator('.filter-details').getAttribute('open')===null)await page.locator('.filter-details summary').click();await page.locator('[data-reset-timeline]').click();};
 const data=await page.evaluate(()=>({events:KNIL_RESEARCH.events,sources:KNIL_RESEARCH.sources,units:KNIL_RESEARCH.units,conflicts:KNIL_RESEARCH.conflicts,hypotheses:KNIL_RESEARCH.hypotheses}));
 check(data.events.length===41&&data.sources.length===39,'All historical records retained');
 check(await page.evaluate(()=>KNIL_APP.chapterFor(KNIL_APP.events.find(e=>e.id==='E025'))===3),'Temporary KL service belongs to the 1950–1951 section');
 check(await page.evaluate(()=>KNIL_APP.chapterFor(KNIL_APP.events.find(e=>e.id==='E022'))===2),'Malang placement belongs to the postwar units section');
 check(await page.locator('h1').textContent().then(t=>t.includes('militaire loopbaan')),'Approved military description');
 check(await page.locator('.chaptertile').count()===5,'Five career sections');
 check(!await page.locator('#military-site').innerText().then(t=>t.toLowerCase().includes('familiearchief')),'No family archive branding');
 await page.screenshot({path:path.join(output,'career-home-desktop.png'),fullPage:true});
 for(let i=0;i<5;i++){await go('#loopbaan/'+i);check(await page.locator('h1').count()===1,'Chapter has one heading '+i);check(await page.locator('.read-copy .evidence-box').count()===1,'Chapter explains evidence '+i);}
 await page.locator('[data-chapter-timeline]').click();check(await page.locator('#timelineChapter').inputValue()==='4','Chapter links to its own filtered timeline');
 await resetTimeline();
 check(await page.locator('[data-event]').count()===41,'All timeline rows');
 for(const e of data.events){
  await page.locator(`[data-event="${e.id}"]`).click();
  check(await page.locator('[data-detail-event]').getAttribute('data-detail-event')===e.id,'Event selection '+e.id);
  const ids=await page.locator('#eventDetail .source-reference-list a[href^="#bronnen/"]').evaluateAll(links=>links.map(a=>a.hash.split('/')[1]));
  check(JSON.stringify(ids)===JSON.stringify(e.source_ids),'Exact source associations '+e.id);
  check(await page.locator('#eventDetail .proof-note').textContent().then(t=>t.length>15),'Evidence limit '+e.id);
 }
 for(const [kind,levels] of [['personal',['A']],['context',['B','C']],['open',['D']]]){await page.locator('#timelineKind').selectOption(kind);const actual=await page.locator('[data-event]').evaluateAll(rows=>rows.map(row=>KNIL_RESEARCH.events.find(e=>e.id===row.dataset.event).evidence_level));check(actual.length>0&&actual.every(l=>levels.includes(l)),'Timeline kind filter '+kind);}
 await page.locator('#timelineKind').selectOption('all');
 await page.locator('.filter-details summary').click();
 for(const level of ['A','B','C','D']){await page.locator('#timelineLevel').selectOption(level);const actual=await page.locator('[data-event]').evaluateAll(rows=>rows.map(row=>KNIL_RESEARCH.events.find(e=>e.id===row.dataset.event).evidence_level));check(actual.length>0&&actual.every(l=>l===level),'Timeline evidence filter '+level);}
 await page.locator('#timelineLevel').selectOption('all');await page.locator('#timelineConfirmed').check();check(await page.locator('[data-event]').evaluateAll(rows=>rows.every(row=>KNIL_RESEARCH.events.find(e=>e.id===row.dataset.event).status==='bevestigd')),'Confirmed-only means confirmed');
 await page.locator('#timelineConfirmed').uncheck();await page.locator('#timelineSearch').fill('zzzzzz');check(await page.locator('[data-event]').count()===0,'Empty search clears selection');
 await page.locator('#timelineSearch').fill('M.C.');check(await page.locator('[data-event]').count()>0,'Search handles military abbreviations');await resetTimeline();
 await go('#tijdlijn/E020');await page.locator('#eventDetail a.primary').click();check(await page.locator('#sourceReader h2').textContent().then(t=>t.includes('22 november')),'Relevant crop is the direct event source');
 for(const s of data.sources){
  await go('#bronnen/'+s.id);check(await page.locator('#sourceSelect').inputValue()===s.id,'Direct source navigation '+s.id);
  check(await page.locator('#sourceReader').textContent().then(t=>t.includes(s.note)),'Complete source note '+s.id);
  for(const img of await page.locator('#sourceReader img').all()){await img.evaluate(i=>i.decode());check(await img.evaluate(i=>i.naturalWidth>0&&!!i.alt),'Actual source image loads '+s.id);}
 }
 for(let i=33;i<=39;i++){
  const id='S'+i;await go('#bronnen/'+id);
  check(await page.locator('#sourceReader .transcript').textContent().then(t=>t.length>50),'Archive transcription '+id);
  check(await page.locator('#sourceReader .scanframe img').getAttribute('src').then(s=>s.endsWith('-uitsnede.png')),'Archive crop is primary '+id);
  const opener=page.locator('#sourceReader .image-actions button').first();await opener.click();await page.locator('#bigImg').evaluate(i=>i.decode());
  check(await page.locator('#sourceModal').evaluate(d=>d.open),'Crop dialog opens '+id);
  await page.locator('#zoomNative').click();check(await page.locator('#bigImg').evaluate(i=>Math.abs(i.getBoundingClientRect().width-i.naturalWidth)<1),'Native pixels '+id);
  await page.keyboard.press('Escape');check(await opener.evaluate(b=>document.activeElement===b),'Focus restored '+id);
  await page.locator('#sourceReader .image-actions button').last().click();await page.locator('#bigImg').evaluate(i=>i.decode());check(await page.locator('#bigImg').getAttribute('src').then(s=>s.endsWith('.jpg')),'Original accessible '+id);await page.locator('#modalClose').click();
 }
 await page.locator('#sourceCategory').selectOption('archive');check(await page.locator('#sourceSelect option').count()===7,'All seven scans discoverable');await page.locator('#sourceSearch').fill('zzzzzz');check(await page.locator('#sourceReader').textContent().then(t=>t.includes('Geen bronnen')),'Source empty state');
 await page.locator('#sourceSearch').fill('');await page.locator('#sourceCategory').selectOption('all');check(await page.locator('#sourceSelect option').count()===39,'All 39 sources discoverable');
 await go('#bronnen/S36');await page.screenshot({path:path.join(output,'career-sources-desktop.png'),fullPage:true});
 await go('#context');check(await page.locator('.history-item').count()===3,'Three distinct historical contexts');check(await page.locator('.unit-list article').count()===data.units.length,'All unit reconstructions preserved');
 await go('#onderzoek');check(await page.locator('[data-conflict]').count()===data.conflicts.length,'Every conflict preserved');check(await page.locator('details').count()>=data.hypotheses.length+data.conflicts.length,'All hypotheses and conflicts accessible');
 await go('#kaart');await page.waitForFunction(()=>!!KNIL_APP.map);
 check(await page.evaluate(()=>KNIL_APP.mapGroups.length===new Set(KNIL_APP.visible.filter(e=>KNIL_APP.coords(e)).map(e=>e.map_location_id||e.location_id)).size),'One marker per location');
 check(await page.evaluate(()=>KNIL_APP.markerGroup.getLayers().length===KNIL_APP.mapGroups.length),'Markers match grouped places');
 await page.locator('#mapChapter').selectOption('1');
 const escape=()=>page.evaluate(()=>{const line=KNIL_APP.routeGroup.getLayers().find(l=>l.options.researchRoute==='ambon-ceram-tual');return line?{points:line.getLatLngs().map(p=>[p.lat,p.lng]),dash:line.options.dashArray,text:line.getTooltip().getContent()}:null;});
 check((await escape())?.points.length===3,'Escape route retains Ceram orientation');check(!await page.evaluate(()=>KNIL_APP.markers.has('seram')),'No invented Ceram landing marker');
 const route=await escape();check(!!route.dash&&route.text.includes('onbekend'),'Escape uncertainty is explicit');
 await page.locator('#showRoutes').uncheck();check(await page.evaluate(()=>KNIL_APP.routeGroup.getLayers().length===0),'Routes toggle clears all lines');await page.locator('#showRoutes').check();
 await page.locator('.filter-details summary').click();await page.locator('#mapConfirmed').check();check(!await escape(),'Confirmed filter excludes testimony route');await page.locator('#mapConfirmed').uncheck();
 await page.locator('#mapChapter').selectOption('3');check(await page.evaluate(()=>KNIL_APP.routeGroup.getLayers().some(l=>l.options.researchRoute==='suez')),'Suez remains a labelled hypothesis');
 await page.locator('#mapSearch').fill('zzzzzz');check(await page.evaluate(()=>KNIL_APP.markerGroup.getLayers().length===0&&KNIL_APP.routeGroup.getLayers().length===0),'Empty map filter removes points and routes');await page.locator('#mapSearch').fill('');
 await page.locator('#mapChapter').selectOption('2');await page.locator('[data-place="malang"]').click();check(await page.locator('#placeDetail h3').textContent().then(t=>t.includes('Malang')),'Places panel selection');check(await page.locator('#placeDetail .place-events article').count()>1,'Same-place administrative events are grouped');
 await page.waitForTimeout(350);await page.screenshot({path:path.join(output,'career-map-desktop.png'),fullPage:true});
 const tileState=await page.locator('.leaflet-tile').evaluateAll(imgs=>({loaded:imgs.filter(i=>i.complete&&i.naturalWidth).length,failed:imgs.filter(i=>i.complete&&!i.naturalWidth).length}));
 // Responsive pages use document scrolling, a compact source picker, and real maps.
 for(const [width,height] of [[1024,900],[390,844],[360,740],[844,390]]){
  await page.setViewportSize({width,height});
  for(const view of ['loopbaan','tijdlijn','kaart','bronnen/S36','context','onderzoek']){
   await go('#'+view);check(await page.locator('main h1').count()===1,'Single heading '+view+' '+width);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow '+view+' '+width);
  }
  if(width<761){
   await go('#bronnen/S36');check(await page.locator('#sourceSelect').isVisible(),'Compact mobile document selector');check(!await page.locator('#sourceList').isVisible(),'Long source list does not precede mobile reader');await page.locator('#sourceSelect').selectOption('S38');check(await page.locator('#sourceReader h2').textContent().then(t=>t.includes('XXIII')),'Mobile source selection');
   await page.locator('#sourceReader .scanframe button').click();await page.locator('#bigImg').evaluate(i=>i.decode());check(await page.locator('#sourceModal').evaluate(d=>d.getBoundingClientRect().width<=innerWidth),'Mobile source viewer fits');await page.locator('#modalClose').click();
   await go('#tijdlijn');await resetTimeline();await page.locator('[data-event="E020"]').click();check(await page.locator('#eventDetail').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=-2&&r.top<innerHeight;}),'Mobile event selection brings reading area into view');
   await go('#bronnen/S36');await page.screenshot({path:path.join(output,`career-sources-${width}.png`),fullPage:true});
  }
 }
 check(errors.length===0,'No browser exceptions: '+errors.join('; '));
 fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify({base,checks,errors,passed:true,tileState},null,2));
 console.log(`PASS: ${checks} assertions; six sections, 41 events, 39 sources, seven crops, image viewer, grouped map, historical uncertainty and responsive layouts.`);await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
