// Public map-first experience, authentic source images and responsive interaction.
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
 await page.waitForFunction(()=>!!window.KNIL_APP?.map);
 if(base.startsWith('http')){await page.waitForFunction(()=>Array.from(document.querySelectorAll('.leaflet-tile')).some(i=>i.complete&&i.naturalWidth>0),null,{timeout:30000});check(true,'Online basemap tiles load');}
 check(await page.locator('h1').innerText()==='Volg zijn route','Map is the landing page');
 check(await page.locator('.topnav a').first().getAttribute('href')==='#kaart','Map is first navigation item');
 check(await page.locator('.topnav a').count()===5,'Five simple navigation items');
 const data=await page.evaluate(()=>({events:KNIL_RESEARCH.events,sources:KNIL_RESEARCH.sources}));
 check(data.events.length===35,'Six unresolved events excluded from public timeline');
 check(data.events.every(e=>e.evidence_level!=='D'),'No hypotheses presented as life events');
 check(await page.evaluate(()=>!KNIL_RESEARCH.hypotheses&&!KNIL_RESEARCH.conflicts&&!KNIL_RESEARCH.presentation.conflictsByEvent),'No research backlog in public bundle');
 check(data.sources.every(s=>s.kind!=='catalogue_only'&&!s.note),'Working source notes and catalogue leads excluded');
 check(await page.locator('#map').evaluate(el=>el.getBoundingClientRect().width>600),'Desktop map is central');
 check(await page.evaluate(()=>KNIL_APP.markerGroup.getLayers().length===KNIL_APP.mapGroups.length),'One marker per grouped place');
 await page.screenshot({path:path.join(output,'map-first-desktop.png'),fullPage:true});
 for(const width of [1440,390,360]){
  await page.setViewportSize({width,height:900});
  for(const id of ['S07','S08']){
   const button=page.locator(`[data-award="${id}"]`);check(await button.isVisible(),'Award visible '+id+' '+width);
   await button.locator('img').evaluate(i=>i.decode());await button.click();await page.locator('#bigImg').evaluate(i=>i.decode());
   check(await page.locator('#bigImg').getAttribute('src')===await page.evaluate(id=>KNIL_RESEARCH.source_images[id],id),'Correct certificate '+id);
   check(await page.locator('#awardExplanation').innerText().then(t=>!t.includes('bewijst')&&!t.includes('Museumcollectie')),'Requested shortened award text '+id);
   await page.locator('#modalClose').click();check(await button.evaluate(b=>document.activeElement===b),'Award focus restored '+id);
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-map-period="1"]').click();
 const escape=await page.evaluate(()=>{const line=KNIL_APP.routeGroup.getLayers().find(l=>l.options.researchRoute==='ambon-ceram-tual');return line?{points:line.getLatLngs(),dash:line.options.dashArray,text:line.getTooltip().getContent()}:null;});
 check(escape?.points.length===3&&!!escape.dash&&escape.text.includes('volgens zijn verklaring'),'Testimony route preserves Ceram as a schematic waypoint');
 check(!await page.evaluate(()=>KNIL_APP.markers.has('seram')),'No invented Ceram landing marker');
 await page.locator('#showRoutes').uncheck();check(await page.evaluate(()=>KNIL_APP.routeGroup.getLayers().length===0),'Routes toggle');await page.locator('#showRoutes').check();
 await page.locator('[data-map-period="3"]').click();
 check(await page.evaluate(()=>KNIL_APP.routeGroup.getLayers().some(l=>l.options.researchRoute==='somersetshire'&&l.getLatLngs().length===2)),'Voyage connects recorded endpoints');
 check(!await page.evaluate(()=>KNIL_APP.routeGroup.getLayers().some(l=>l.options.researchRoute==='suez')),'No hypothetical Suez itinerary');
 await go('#kaart/E020');check(await page.locator('#placeDetail h2').innerText().then(t=>t.includes('Oost-Java')),'Deep link selects the event on the map');
 await page.locator('[data-point-tab="bron"]').click();check(await page.locator('.point-scan img').getAttribute('src').then(s=>s.endsWith('0250-uitsnede.png')),'Relevant crop appears in point panel');
 await page.locator('.point-scan').click();await page.locator('#bigImg').evaluate(i=>i.decode());check(await page.locator('#sourceModal').evaluate(d=>d.open),'Point panel image opens');await page.keyboard.press('Escape');
 await page.locator('[data-point-tab="context"]').click();check(await page.locator('.point-copy').innerText().then(t=>t.includes('onafhankelijkheidsoorlog')),'Historical context in point panel');
 await page.locator('[data-point-tab="verhaal"]').click();
 await page.locator('[aria-label="Volgende gebeurtenis"]').click();check(await page.evaluate(()=>KNIL_APP.state.map.event)==='E022','Next point advances the chronology');await page.locator('[aria-label="Vorige gebeurtenis"]').click();check(await page.evaluate(()=>KNIL_APP.state.map.event)==='E020','Previous point restores selection');
 await page.locator('#mapPlace').selectOption('malang');check(await page.evaluate(()=>KNIL_APP.state.map.place)==='malang','Place selector syncs map');
 await page.locator('.other-events summary').click();check(await page.locator('.other-events button').count()>1,'Same-place events kept together');await page.locator('.other-events button').last().click();check(await page.locator('#placeDetail h2').innerText().then(t=>t.length>5),'Same-place event selection');
 await page.locator('#mapSearch').fill('zzzzzz');check(await page.evaluate(()=>KNIL_APP.markerGroup.getLayers().length===0&&KNIL_APP.routeGroup.getLayers().length===0),'Empty map search clears map');await page.locator('#mapSearch').fill('');
 await page.locator('[data-fit-map]').click();
 await go('#tijdlijn');await page.locator('[data-reset-timeline]').click();check(await page.locator('[data-event]').count()===35,'All public timeline events');
 for(const e of data.events){
  await page.locator(`[data-event="${e.id}"]`).click();check(await page.locator('[data-detail-event]').getAttribute('data-detail-event')===e.id,'Timeline selection '+e.id);
  check(await page.locator('#eventDetail').innerText().then(t=>t.includes(e.notes)),'Public reading text '+e.id);
  check(await page.locator('#eventDetail .proof-note').count()===0,'No proof assessment '+e.id);
 }
 await page.locator('#timelineKind').selectOption('context');check(await page.locator('[data-event]').count()===3,'Context separated from personal events');await page.locator('#timelineKind').selectOption('personal');check(await page.locator('[data-event]').count()===32,'Personal timeline filter');await page.locator('[data-reset-timeline]').click();
 await page.locator('#timelineSearch').fill('zzzzzz');check(await page.locator('[data-event]').count()===0,'Timeline empty state');await page.locator('[data-reset-timeline]').click();
 for(const source of data.sources){
  await go('#bronnen/'+source.id);check(await page.locator('#sourceSelect').inputValue()===source.id,'Source navigation '+source.id);
  check(!await page.locator('#sourceReader').innerText().then(t=>t.includes('Bronbeschrijving en bewijsgrens')),'No working source assessment '+source.id);
  for(const img of await page.locator('#sourceReader img').all()){await img.evaluate(i=>i.decode());check(await img.evaluate(i=>i.naturalWidth>0&&!!i.alt),'Authentic image loads '+source.id);}
 }
 for(let i=33;i<=39;i++){
  await go('#bronnen/S'+i);check(await page.locator('.transcript').innerText().then(t=>t.length>50),'Archive transcription S'+i);
  const opener=page.locator('#sourceReader .image-actions button').first();await opener.click();await page.locator('#bigImg').evaluate(i=>i.decode());await page.locator('#zoomNative').click();check(await page.locator('#bigImg').evaluate(i=>Math.abs(i.getBoundingClientRect().width-i.naturalWidth)<1),'Original pixel zoom S'+i);await page.keyboard.press('Escape');check(await opener.evaluate(b=>document.activeElement===b),'Reader focus S'+i);
  await page.locator('#sourceReader .image-actions button').last().click();await page.locator('#bigImg').evaluate(i=>i.decode());check(await page.locator('#bigImg').getAttribute('src').then(s=>s.endsWith('.jpg')),'Full scan available S'+i);await page.locator('#modalClose').click();
 }
 await page.locator('#sourceCategory').selectOption('archive');check(await page.locator('#sourceSelect option').count()===7,'Seven archive scans remain');await page.locator('#sourceSearch').fill('zzzzzz');check(await page.locator('#sourceReader').innerText().then(t=>t.includes('Geen bronnen')),'Source empty state');
 await go('#loopbaan');check(await page.locator('.chaptertile').count()===5,'Five readable chapters');
 for(let i=0;i<5;i++){await go('#loopbaan/'+i);check(await page.locator('main h1').count()===1,'Chapter heading '+i);check(await page.locator('.evidence-box').count()===0,'No chapter research assessment '+i);await page.locator('[data-chapter-map]').click();check(await page.evaluate(()=>KNIL_APP.state.map.chapter)===String(i),'Chapter opens corresponding map period '+i);}
 await go('#context');check(await page.locator('.history-item').count()===3,'Historical context retained');
 await go('#onderzoek');check(await page.locator('#map').count()===1,'Old research URL returns to map');
 for(const [width,height] of [[1440,1000],[1024,900],[390,844],[360,740],[844,390]]){
  await page.setViewportSize({width,height});
  for(const view of ['kaart','tijdlijn','loopbaan','bronnen/S36','context']){
   await go('#'+view);check(await page.locator('main h1').count()===1,'One heading '+view+' '+width);check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+view+' '+width);
   check(!await page.locator('#military-site').innerText().then(t=>/hypothes|bewijsniveau|bronverschillen|wat staat nog open|onderzoeksvraag/i.test(t)),'Public view has no research backlog '+view+' '+width);
  }
  await go('#kaart/E020');await page.locator('[data-point-tab="bron"]').click();await page.locator('.point-scan img').evaluate(i=>i.decode());
  await page.screenshot({path:path.join(output,`map-first-${width}.png`),fullPage:true});
  if(width<761){check(await page.locator('#map').evaluate(el=>el.getBoundingClientRect().height>=300),'Useful mobile map height');await page.locator('.point-scan').click();await page.locator('#bigImg').evaluate(i=>i.decode());check(await page.locator('#sourceModal').evaluate(d=>d.getBoundingClientRect().width<=innerWidth),'Mobile viewer fits');await page.locator('#modalClose').click();}
 }
 const tileState=await page.locator('.leaflet-tile').evaluateAll(imgs=>({loaded:imgs.filter(i=>i.complete&&i.naturalWidth).length,failed:imgs.filter(i=>i.complete&&!i.naturalWidth).length}));
 check(errors.length===0,'No browser exceptions '+errors.join('; '));
 fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify({base,checks,errors,passed:true,tileState},null,2));
 console.log(`PASS: ${checks} assertions; map landing page, public reading copy, point navigation, source crops, certificates, routes and responsive layouts.`);await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
