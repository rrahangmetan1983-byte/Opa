'use strict';
(() => {
  const data = window.KNIL_RESEARCH;
  const by = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sources = new Map(data.sources.map(s => [s.id, s]));
  const locations = new Map(data.locations.map(l => [l.id, l]));
  const labels = {A:'Persoonlijk bevestigd', B:'Eenheid bevestigd', C:'Historische context', D:'Hypothese / onderzoeksvraag'};
  const colors = {personal:'#53647a', military:'#28669b', occupation:'#b43b32', independence:'#805d36', voyage:'#bd7b20', netherlands:'#526f55'};
  const topicNames = {personal:'Persoonlijke geschiedenis', military:'Militaire eenheden en overplaatsingen', occupation:'Japanse bezetting', independence:'Indonesische onafhankelijkheidsoorlog', voyage:'Overtocht naar Nederland', netherlands:'Leven in Nederland'};
  function topics(e) {
    const number = Number(e.id.slice(1));
    if (number <= 3) return ['personal'];
    if (number <= 12) return number === 4 ? ['military','occupation'] : ['occupation'];
    if (number <= 30) return ['military','independence'];
    if (number <= 34) return ['voyage'];
    return ['netherlands','personal'];
  }
  const events = data.events.map((e, i) => ({...e, number:i+1, topics:e.topics||topics(e)}));
  const sourceKind = {primary_scan:'originele archiefscan', project_primary_copy:'militair document uit familieproject', personal_testimony:'persoonlijke verklaring', archive_index:'archiefindex; geen originele lijstscan', institutional_context:'institutionele context', secondary_unit_history:'secundaire korpsgeschiedenis', research_context:'historisch onderzoek', catalogue_only:'cataloguslead; dossierinhoud niet gelezen', primary_map:'historische kaart', local_history:'plaatselijke geschiedenis', secondary_index:'secundaire index', secondary_context:'secundaire context', retrospective_military_account:'naoorlogse militaire reconstructie', project_primary_scan:'archiefbeeld uit project'};
  function formatDateValue(value) {
    if (/^\d{4}-\d\d-\d\d$/.test(value)) return new Intl.DateTimeFormat('nl-NL', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
    if (/^\d{4}-\d\d$/.test(value)) return new Intl.DateTimeFormat('nl-NL', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'-01T12:00:00Z'));
    return value;
  }
  function dateLabel(e) {
    if (!e.date) return 'Datum niet vastgesteld';
    if (typeof e.date === 'object') return `${formatDateValue(e.date.start)} – ${formatDateValue(e.date.end)}`;
    return formatDateValue(e.date);
  }
  function badge(e) {
    if (e.source_ids.includes('S06') && e.status !== 'bevestigd') return {text:'Persoonlijke verklaring · details onzeker', cls:'personal'};
    if (e.evidence_level === 'D') return {text:e.status === 'aannemelijk' ? 'Hypothese · aannemelijk' : 'Hypothese · niet bevestigd', cls:'personal'};
    return {text:labels[e.evidence_level], cls:e.evidence_level === 'A' ? 'direct' : 'mixed'};
  }
  let current = null;
  let visible = [...events];
  let selectedMarker = null;
  let expandedCluster = null;
  let expandedMarkers = [];
  let layoutMode = matchMedia('(max-width:850px)').matches ? 'mobile' : 'desktop';
  let map, markerGroup, routeGroup;
  const markers = new Map();
  const rows = new Map();
  function mapLocation(e) { return locations.get(e.map_location_id || e.location_id); }
  function coordinates(e) {
    const loc = mapLocation(e);
    return loc?.coordinates ? [loc.coordinates[1],loc.coordinates[0]] : null;
  }
  function isMobile() { return layoutMode === 'mobile'; }
  function setPoints(open) {
    if (isMobile()) by('left').classList.toggle('open',open);
    else document.body.classList.toggle('points-hidden',!open);
    by('pointsBtn').setAttribute('aria-expanded',String(open));
    by('pointsBtn').textContent = open ? '✕ Sluit punten' : '☰ Punten';
    setTimeout(refreshMap,80);
  }
  function closeDetails() {
    by('detail').classList.remove('open','expanded');
    document.body.classList.remove('detail-open');
    by('sheetSize').textContent='Meer lezen';
    by('sheetSize').setAttribute('aria-expanded','false');
    setTimeout(refreshMap,60);
  }
  function applyLayout(mode) {
    layoutMode=mode;
    document.body.classList.toggle('mobile-view',isMobile());
    document.body.classList.toggle('desktop-view',!isMobile());
    by('left').classList.remove('open');
    document.body.classList.remove('points-hidden');
    by('pointsBtn').setAttribute('aria-expanded',String(!isMobile()));
    by('pointsBtn').textContent=isMobile()?'☰ Punten':'✕ Sluit punten';
    by('viewBtn').textContent=isMobile()?'🖥 Desktop':'📱 Mobiel';
    by('viewBtn').setAttribute('aria-pressed',String(isMobile()));
    setTimeout(refreshMap,100);
  }
  function detailCover() {
    if (!map || !isMobile() || !by('detail').classList.contains('open')) return [0,0];
    const d=by('detail').getBoundingClientRect(),m=by('map').getBoundingClientRect();
    return d.width<m.width*.9?[d.width,0]:[0,d.height];
  }
  function center(e, zoom) {
    const point=coordinates(e);if(!point||!map)return;
    const [right,bottom]=detailCover();
    const target=map.project(point,zoom).add([right/2,bottom/2]);
    map.setView(map.unproject(target,zoom),zoom,{animate:false});
  }
  function highlight() {
    selectedMarker?.setZIndexOffset(2000);
    selectedMarker?.getElement()?.classList.add('selected-marker');
  }
  function reveal() {
    if (!selectedMarker||!markerGroup)return;
    const parent=markerGroup.getVisibleParent(selectedMarker);
    if(parent&&parent!==selectedMarker)parent.spiderfy();
    highlight();
  }
  function refreshMap() {
    if(!map)return;
    expandedCluster?.unspiderfy();map.invalidateSize();
    if(current&&by('detail').classList.contains('open')) {
      if(escapeEventIds.includes(current.id)&&escapeRouteVisible())fitEscapeRoute();
      else if(coordinates(current))center(current,map.getZoom());
      reveal();
    }
  }
  function clearSelection() {
    selectedMarker?.getElement()?.classList.remove('selected-marker');
    selectedMarker?.setZIndexOffset(0);expandedCluster?.unspiderfy();selectedMarker=null;
  }
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach(b=>{const selected=b.dataset.tab===name;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));});
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id===name));
    document.querySelectorAll('.pane.active img[data-src]').forEach(img=>{img.src=img.dataset.src;delete img.dataset.src;});
  }
  function sourceLink(s) {
    if(!s.url)return '';
    return `<a target="_blank" rel="noopener noreferrer" href="${escape(s.url)}">${escape(s.id)} · Open originele bron ↗</a>`;
  }
  function renderSources(e) {
    by('sourceGallery').innerHTML='';
    const orderedSources=[...e.source_ids].sort((a,b)=>Number(!!data.source_details?.[b])-Number(!!data.source_details?.[a]));
    by('sourceLinks').innerHTML=orderedSources.map(id=>{
      const s=sources.get(id),img=data.source_images[id],detail=data.source_details?.[id];
      const archive=s.archive_access?`Nationaal Archief · ${s.archive_access} · inv. ${s.inventory??'niet vastgesteld'}`:'Archiefgegevens: '+(sourceKind[s.kind]||s.kind);
      if(detail)return `<article class="card research-source archive-source" data-source-id="${escape(id)}"><h3>${escape(id)} · ${escape(s.title)}</h3><p>${escape(archive)} · bestand ${escape(detail.id)} · gedrukte pagina ${escape(detail.page)}</p><p class="source-note">Eenheidscontext · geen bewijs van persoonlijke deelname</p><button type="button" class="scan-button crop-button" data-archive-crop="${escape(id)}"><img loading="lazy" data-src="${escape(detail.crop)}" alt="Relevante uitsnede: ${escape(detail.title)}"><span>Open relevante uitsnede groot</span></button><p class="source-note">Uitsnede op oorspronkelijke resolutie; geen kunstmatige vergroting.</p><h4>Transcriptie</h4><pre class="source-transcript">${escape(detail.transcript)}</pre><h4>Historisch kader</h4><p>${escape(detail.context)}</p><p class="proof-limit"><strong>Betekenis voor Daniël:</strong> ${escape(detail.boundary)}</p><p><button type="button" class="original-source-button" data-source-image="${escape(id)}">Bekijk volledig origineel</button></p><p><a href="${escape(detail.source_url)}" target="_blank" rel="noopener">Nationaal Archief · exacte bron ↗</a></p><p><a href="${escape(s.url)}" target="_blank" rel="noopener">Volledige bronpresentatie en herkomst ↗</a></p></article>`;
      return `<article class="card research-source" data-source-id="${escape(id)}"><h3>${escape(id)} · ${escape(s.title)}</h3><p>${escape(archive)}${s.scan_page?` · scan/pagina ${escape(s.scan_page)}`:''}</p><p class="source-note">${escape(sourceKind[s.kind]||s.kind)}</p>${img?`<button type="button" class="scan-button" data-source-image="${escape(id)}"><img loading="lazy" data-src="${escape(img)}" alt="${escape(s.title)}"><span>Bekijk dit bronbeeld groot</span></button>`:''}${sourceLink(s)}<p class="proof-limit">${escape(s.note)}</p>${s.kind==='catalogue_only'?'<p><b>Alleen onderzoekslead: de inhoud van het dossier is niet ingezien.</b></p>':''}</article>`;
    }).join('');
    by('sourceLinks').querySelectorAll('[data-source-image]').forEach(button=>button.onclick=()=>openSource(data.source_images[button.dataset.sourceImage],sources.get(button.dataset.sourceImage).title));
    by('sourceLinks').querySelectorAll('[data-archive-crop]').forEach(button=>button.onclick=()=>openSource(data.source_details[button.dataset.archiveCrop].crop,'Relevante uitsnede · '+sources.get(button.dataset.archiveCrop).title));
      by('sourceLinks').insertAdjacentHTML('beforeend',`<p class="source-note"><a href="${data.rights_url}" target="_blank" rel="noopener">Verantwoording beeldgebruik</a> · <a href="research/archiefbronnen-1947.html">Archiefscans 1947: originelen, uitsneden en transcripties</a></p>`);
  }
  const contexts={
    personal:{text:'Daniëls herkomst en gezin worden beschreven in zijn militaire persoonsgegevens. Administratieve geboorte- en huwelijksdatums verschillen soms van latere indexen.',ids:['S01','S04','S19']},
    occupation:{text:'Ambon werd eind januari 1942 door Japan aangevallen. NFIS-rapporten, Australische militaire stukken en een naoorlogse Japanse reconstructie beschrijven de verdediging en capitulatie. Het rapport over Tual plaatst de Japanse bezetting op 30 juli. Deze bronnen bevestigen Daniëls persoonlijke gevangenneming of exacte vluchtroute niet zelfstandig.',ids:['S09','S11','S12','S13','S15','S16','S17','S18']},
    military:{text:'De naoorlogse plaatsingen laten een reeks militaire en administratieve wijzigingen zien. “Overgegaan” bewijst de geregistreerde indeling. Reorganisatie of een ander compagnienummer op dezelfde plaats bewijst geen afzonderlijk vervoer.',ids:['S02','S03','S05','S26']},
    independence:{text:'Daniëls dienst op Sulawesi en Oost-Java viel in de Indonesische onafhankelijkheidsoorlog. Nederland trachtte het koloniale gezag te herstellen; Indonesië verdedigde zijn onafhankelijkheid. NIOD/KITLV/NIMH beschrijven structureel extreem Nederlands geweld en gevolgen voor burgers. Geen specifiek incident wordt zonder individueel bewijs aan Daniël toegeschreven.',ids:['S24','S26']},
    voyage:{text:'Het persoonlijke vervolgblad noemt de Somersetshire: vertrek 9 april en aankomst 15 mei 1951. De scheepscontext noemt Jakarta/Tanjung Priok, maar vertrekdatums verschillen. De index koppelt een echtgenote en vier kinderen aan zijn gezin. De oorspronkelijke passagierslijstscan en het scheepsjournaal zijn nog niet ingezien. Het traject via Suez blijft een aannemelijke reconstructie.',ids:['S05','S19','S20','S21','S22','S31','S32']},
    netherlands:{text:'Laarbrug en Eerde zijn belangrijke aanknopingspunten, maar een persoonlijke woonvolgorde is niet vastgesteld. CAZ-dossier 725 betreft D. Rahangmetan, geboren 1 januari 1917, periode 1952–1966; de inhoud heeft geen beschikbare digitale scans. Een latere verklaring vermeldt Zwolle.',ids:['S06','S25','S29','S30']}
  };
  const conflictsByEvent={E001:['K01'],E004:['K02'],E005:['K03'],E006:['K03'],E010:['K04'],E014:['K06'],E015:['K05'],E016:['K06'],E017:['K06'],E019:['K06'],E020:['K06'],E021:['K07'],E022:['K12'],E032:['K08','K10'],E034:['K09']};
  function renderContext(e) {
    const categories=[...new Set(e.topics)];
    by('contextText').textContent=categories.map(t=>contexts[t].text).join('\n\n');
    by('importanceText').textContent=e.evidence_level==='D'?'Deze vraag blijft zichtbaar zodat nieuw bewijs later kan worden toegevoegd. Zij wordt niet als vaststaand levensfeit weergegeven.':'Het document ondersteunt de vermelde registratie of verklaring. Het bewijst geen niet-genoemde patrouilles, gevechten of exacte transporttrajecten.';
    let html='';
    for(const id of conflictsByEvent[e.id]||[]) {
      const c=data.conflicts.find(c=>c.id===id);
      html+=`<article class="card legal"><h3>Bronverschil · ${escape(c.subject)}</h3><p>${escape(c.readings)}</p><p>${escape(c.resolution)}</p></article>`;
    }
    if(e.id==='E022')html+='<article class="card"><h3>Eenheidsniveau · Infanterie IV</h3><p>De gelezen secundaire korpsgeschiedenis onderscheidt het oude Inf. IV, opgeheven in maart 1948, en het opnieuw gevormde bataljon in het najaar van 1948 te Malang. Commandanten van het oude bataljon zijn geen bewezen commandanten van Daniël in Malang.</p><p>Compagnie-indeling, eigen patrouilles en operationele opdrachten van Daniël blijven open.</p></article>';
    if(e.id==='E032'||e.id==='E034')html+='<article class="card"><h3>Het gezin op de Somersetshire</h3><p>De aankomstindex koppelt een echtgenote, twee zonen en twee dochters aan D. Rahangmetang. Vergelijking met de familiebronnen wijst op Orpa Oebra, Johannis, Justus/Jantje, Jacoba en Perentjina. De originele passagierslijstscan is nog niet ingezien.</p><p>Het foutieve legernummerveld in de index wordt niet als identificatie gebruikt. De persoonlijke documenten gebruiken 171301443.</p></article>';
    html+=`<article class="card"><h3>Contextbronnen</h3>${[...new Set(categories.flatMap(t=>contexts[t].ids))].map(id=>{const s=sources.get(id);return `<p>${sourceLink(s)||escape(s.title)}</p>`;}).join('')}</article>`;
    by('extraContext').innerHTML=html;
    by('gallery').innerHTML='';
    const loc=mapLocation(e);
    by('places').innerHTML=`<li>${escape(loc?.label||'Locatie niet vastgesteld')}${loc?.coordinates?' · globaal kaartpunt; geen exact garnizoen':''}</li>`;
  }
  function select(e, keepTab=false, fromMarker=false) {
    const preserveGroup=fromMarker&&expandedMarkers.includes(markers.get(e.id));
    const zoom=preserveGroup&&map?map.getZoom():(e.location_id==='halong'?12:mapLocation(e)?.coordinate_precision==='island_approximate'?7:10);
    current=e;by('detail').classList.add('open');document.body.classList.add('detail-open');
    by('detail').scrollTop=0;by('pointnav').hidden=false;
    by('dt').textContent=e.number+'. '+e.title;by('dd').textContent=dateLabel(e);
    const b=badge(e);by('evidenceBadge').className='evidence '+b.cls;by('evidenceBadge').textContent=b.text;
    by('storyText').textContent=e.notes||e.title;
    by('proofSummary').textContent=`Bewijsniveau: ${labels[e.evidence_level]}. ${e.evidence_level==='B'?'Eenheidsgegevens in een periode van gedocumenteerd lidmaatschap; geen individueel actiebevel.':e.evidence_level==='C'?'Historisch beschreven gebeurtenis; Daniëls aanwezigheid of persoonlijke deelname niet bewezen.':e.source_ids.includes('S06')?'Daniëls eigen herinneringsverklaring; geen zelfstandig erkenningsbesluit gezien.':e.status==='bevestigd'?'Geregistreerd in de aangehaalde persoonlijke bron.':`Bewijskracht: ${e.status}.`}`;
    const point=coordinates(e);
    by('locationNote').textContent=point?(e.location_inferred?'Kaartplaats ontleend aan scheepscontext; het persoonlijke dienstblad noemt geen haven.':'Kaartpunt geeft de plaats of het gebied bij benadering weer, geen exacte verblijfplaats.'):'Geen voldoende gecontroleerde kaartcoördinaat. Deze gebeurtenis blijft in de tijdlijn zonder marker.';
    by('routeNote').hidden=!e.topics.includes('voyage')&&!escapeEventIds.includes(e.id);
    by('routeNote').textContent=escapeEventIds.includes(e.id)?'Ambon → Ceram → Tual volgens Daniëls latere verklaring (S06). De onderbroken lijn toont de plaatsvolgorde schematisch; het punt bij Ceram is alleen een oriëntatiepunt in het eilandgebied. Landingsplaats en precieze vaarroute zijn niet bewezen.':'De onderbroken Suezlijn is een vermoedelijk traject. Tussenstops en precieze vaarroutes zijn niet bewezen.';
    by('quoteBox').hidden=!e.original_excerpt;
    by('quoteLabel').textContent='Originele bronpassage';by('quoteText').textContent=e.original_excerpt||'';
    by('quoteNote').textContent='Lees de volledige bron en bewijsgrens in de tab Bronnen.';
    const img=e.source_ids.map(id=>data.source_images[id]).find(Boolean);
    by('fragmentImg').hidden=!img;by('storySource').hidden=!img;
    if(img){by('fragmentImg').src=img;by('fragmentImg').alt='Persoonlijk bronbeeld bij '+e.title;by('storySource').onclick=()=>openSource(img,e.title);by('fragmentImg').onclick=()=>openSource(img,e.title);}
    else by('fragmentImg').removeAttribute('src');
    renderContext(e);renderSources(e);
    clearSelection();selectedMarker=markers.get(e.id)||null;
    for(const [id,row] of rows){const active=id===e.id;row.classList.toggle('selected',active);row.setAttribute('aria-pressed',String(active));}
    if(!rows.get(e.id)?.hidden)rows.get(e.id)?.scrollIntoView({block:'nearest'});
    updateNavigation();
    showTab(keepTab?document.querySelector('.tabs .active')?.dataset.tab||'story':'story');
    if(isMobile())setPoints(false);
    setTimeout(()=>{
      if(current!==e||!map)return;map.invalidateSize();
      if(escapeEventIds.includes(e.id)&&escapeRouteVisible()){
        fitEscapeRoute();
        if(point)reveal();
      }else if(point){center(e,zoom);reveal();}
    },100);
  }
  function updateNavigation() {
    const i=current?visible.findIndex(e=>e.id===current.id):-1;
    by('pointPos').textContent=i<0?'':`${i+1} van ${visible.length}`;
    by('prevPoint').disabled=i<=0;by('nextPoint').disabled=i<0||i>=visible.length-1;
  }
  function browse(direction) {
    const i=visible.findIndex(e=>e.id===current?.id)+direction;
    if(i>=0&&i<visible.length)select(visible[i],true);
  }
  const voyageRoute=[[-6.1,106.88],[-6.8,104.6],[-8.5,100],[-7,82],[11.9,50],[12.2,44],[16.9,41],[22,37.8],[27.6,34],[29.9,32.55],[30.3,32.45],[31.2,32.3],[33.2,28],[35,19],[37,9],[36,-5.7],[43,-10],[49,-5],[51.2,1.8],[52.5,4.55],[52.37,4.9]];
  const escapeEventIds=['E007','E008','E009'];
  // Ceram has no known landing site. Its route waypoint must never become a marker.
  const escapeRoute=escapeEventIds.map(id=>{
    const e=events.find(event=>event.id===id),waypoint=e.route_waypoint?.coordinates;
    return waypoint?[waypoint[1],waypoint[0]]:coordinates(e);
  });
  function escapeRouteVisible(){
    return by('showRoutes').checked&&escapeRoute.every(Boolean)&&escapeEventIds.every(id=>visible.some(e=>e.id===id));
  }
  function fitEscapeRoute(){
    const [right,bottom]=detailCover();
    map.fitBounds(L.latLngBounds(escapeRoute),{paddingTopLeft:[30,30],paddingBottomRight:[right+30,bottom+30],maxZoom:7,animate:false});
  }
  function rebuildRoutes() {
    if(!map)return;routeGroup.clearLayers();
    if(!by('showRoutes').checked)return;
    let previous=null;
    for(const e of visible) {
      const point=coordinates(e);
      if(!point||e.topics.includes('voyage')||e.evidence_level!=='A') {previous=null;continue;}
      if(previous&&previous.point.toString()!==point.toString()&&previous.event.topics.some(t=>e.topics.includes(t))) {
        const testimony=previous.event.status!=='bevestigd'||e.status!=='bevestigd';
        L.polyline([previous.point,point],{color:colors[e.topics[0]],weight:3,dashArray:testimony?'5 8':'',opacity:.65}).bindTooltip(testimony?'Plaatsen uit persoonlijke verklaring · traject onzeker':'Geregistreerde plaatsen · schematische verbinding, geen bewezen traject').addTo(routeGroup);
      }
      previous={event:e,point};
    }
    if(escapeRouteVisible()) L.polyline(escapeRoute,{color:colors.occupation,weight:3,dashArray:'5 8',opacity:.75,researchRoute:'ambon-ceram-tual'}).bindTooltip('Ambon → Ceram → Tual · persoonlijke verklaring S06 · schematisch via eilandgebied; landingsplaats en vaarroute onbekend').addTo(routeGroup);
    if(visible.some(e=>e.id==='E032')&&visible.some(e=>e.id==='E034')&&!by('confirmedOnly').checked) L.polyline(voyageRoute,{color:colors.voyage,weight:3,dashArray:'8 9',opacity:.7}).bindTooltip('Vermoedelijk traject via Suez · tussenstops niet bevestigd').addTo(routeGroup);
  }
  function applyFilters() {
    const query=by('pointSearch').value.trim().toLocaleLowerCase('nl');
    const topic=by('phaseFilter').value;const level=by('evidenceFilter').value;
    visible=events.filter(e=>(!topic||e.topics.includes(topic))&&(!level||e.evidence_level===level)&&(!by('confirmedOnly').checked||e.status==='bevestigd')&&(!query||`${e.number} ${e.title} ${dateLabel(e)} ${e.unit||''} ${e.notes} ${e.id}`.toLocaleLowerCase('nl').includes(query)));
    const ids=new Set(visible.map(e=>e.id));
    for(const [id,row] of rows)row.hidden=!ids.has(id);
    if(map){clearSelection();markerGroup.clearLayers();for(const e of visible){const m=markers.get(e.id);if(m)markerGroup.addLayer(m);}if(current&&ids.has(current.id))selectedMarker=markers.get(current.id)||null;rebuildRoutes();}
    const count=visible.filter(e=>coordinates(e)).length;
    by('resultCount').textContent=visible.length?`${visible.length} van ${events.length} gebeurtenissen · ${count} kaartpunten`:'Geen gebeurtenissen gevonden. Pas de filters aan.';
    if(current&&!ids.has(current.id)){current=null;closeDetails();for(const row of rows.values()){row.classList.remove('selected');row.setAttribute('aria-pressed','false');}}
    updateNavigation();
  }
  function fitAll() {
    if(!map)return;
    const points=visible.map(coordinates).filter(Boolean);
    if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[40,40],maxZoom:9,animate:false});
  }
  function initMap() {
    if(!window.L||!L.markerClusterGroup){by('mapStatus').hidden=false;by('mapStatus').textContent='De kaart kon niet worden geladen. De tijdlijn, verhalen en bronnen blijven beschikbaar.';return;}
    map=L.map('map').setView([-4.7,130],6);
    const street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-bijdragers'});
    const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:19,attribution:'Satellietbeelden © Esri, Maxar, Earthstar Geographics en partners'});
    const topo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'Kaartgegevens © OpenStreetMap-bijdragers · kaartstijl © OpenTopoMap'});
    const base={'Wegenkaart':street,'Satelliet':satellite,'Topografisch':topo};let saved;
    try{saved=localStorage.getItem('opa-basemap');}catch{}
    (base[saved]||street).addTo(map);L.control.layers(base,null,{position:'topright',collapsed:true}).addTo(map);
    map.on('baselayerchange',e=>{try{localStorage.setItem('opa-basemap',e.name);}catch{}});
    routeGroup=L.layerGroup().addTo(map);
    markerGroup=L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true,animate:false,spiderfyDistanceMultiplier:1.6,maxClusterRadius:42,iconCreateFunction:cluster=>L.divIcon({html:`<div><span>${cluster.getChildCount()} punten</span></div>`,className:'marker-cluster marker-cluster-small labeled-cluster',iconSize:L.point(64,40)})});
    for(const e of events) {
      const point=coordinates(e);if(!point)continue;
      const m=L.marker(point,{title:e.number+'. '+e.title,keyboard:true,icon:L.divIcon({className:'mi',html:`<div class="num ${e.status!=='bevestigd'?'uncertain-point':''}" style="background:${colors[e.topics[0]]}">${e.number}</div>`,iconSize:[34,34],iconAnchor:[17,17]})}).on('click',()=>select(e,false,true));
      markers.set(e.id,m);
    }
    markerGroup.on('spiderfied',e=>{expandedCluster=e.cluster;expandedMarkers=e.markers;highlight();});
    markerGroup.on('unspiderfied',()=>{expandedCluster=null;expandedMarkers=[];});
    markerGroup.addTo(map);applyFilters();
    window.KNIL_APP={events,markers,map,markerGroup,routeGroup,get visible(){return visible;},get current(){return current;},select,applyFilters,voyageRoute};
  }
  for(const e of events) {
    const row=document.createElement('button');row.type='button';row.className='event';row.dataset.eventId=e.id;row.setAttribute('aria-pressed','false');
    const b=badge(e);row.innerHTML=`<span class="badge" style="background:${colors[e.topics[0]]}">${e.number}</span><div><b>${escape(e.title)}</b><small>${escape(dateLabel(e))}</small><span class="evidence ${b.cls}">${escape(b.text)}</span>${!coordinates(e)?'<small class="no-map">Geen gecontroleerd kaartpunt</small>':''}</div>`;
    row.onclick=()=>select(e);rows.set(e.id,row);by('list').append(row);
  }
  by('prevPoint').onclick=()=>browse(-1);by('nextPoint').onclick=()=>browse(1);by('detailClose').onclick=closeDetails;
  document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
  for(const id of ['pointSearch','phaseFilter','evidenceFilter','confirmedOnly'])by(id).addEventListener(id==='pointSearch'?'input':'change',applyFilters);
  by('showRoutes').onchange=rebuildRoutes;
  by('pointsBtn').onclick=()=>setPoints(isMobile()?!by('left').classList.contains('open'):document.body.classList.contains('points-hidden'));
  by('viewBtn').onclick=()=>applyLayout(isMobile()?'desktop':'mobile');
  by('sheetSize').onclick=()=>{const expanded=by('detail').classList.toggle('expanded');by('sheetSize').textContent=expanded?'Meer kaart':'Meer lezen';by('sheetSize').setAttribute('aria-expanded',String(expanded));refreshMap();};
  by('allRoute').onclick=()=>{by('pointSearch').value='';by('phaseFilter').value='';by('evidenceFilter').value='';by('confirmedOnly').checked=false;applyFilters();current=null;clearSelection();closeDetails();for(const row of rows.values()){row.classList.remove('selected');row.setAttribute('aria-pressed','false');}if(isMobile())setPoints(false);setTimeout(()=>{if(!current)fitAll();},120);};
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(refreshMap,120);});
  matchMedia('(max-width:850px)').addEventListener('change',e=>applyLayout(e.matches?'mobile':'desktop'));
  by('historicalMap').href=data.historical_map_url;
  by('reportLink').href=data.report_url;

  // Source viewer: fit/native scale, zoom, drag, focus restoration and trapping.
  const modal=by('sourceModal'),big=by('bigImg'),scroll=by('imageScroll');let trigger=null,fit=true;
  function fitSource(){fit=true;scroll.classList.add('fit');big.style.width='auto';scroll.scrollLeft=0;scroll.scrollTop=0;}
  function scale(){return big.naturalWidth?big.getBoundingClientRect().width/big.naturalWidth:1;}
  function setScale(value,reset=false){const r=big.getBoundingClientRect();const x=(scroll.scrollLeft+scroll.clientWidth/2)/(r.width||1),y=(scroll.scrollTop+scroll.clientHeight/2)/(r.height||1);fit=false;scroll.classList.remove('fit');big.style.width=Math.max(1,big.naturalWidth*Math.min(4,Math.max(.05,value)))+'px';const next=big.getBoundingClientRect();scroll.scrollLeft=reset?0:x*next.width-scroll.clientWidth/2;scroll.scrollTop=reset?0:y*next.height-scroll.clientHeight/2;}
  function openSource(src,title){if(!src)return;trigger=document.activeElement;by('modalTitle').textContent=title||'Bron';modal.classList.add('open');fitSource();big.onload=()=>{if(fit)fitSource();};big.src=src;document.querySelector('.app').inert=true;document.querySelector('.top').inert=true;by('modalClose').focus();}
  function closeSource(){modal.classList.remove('open');document.querySelector('.app').inert=false;document.querySelector('.top').inert=false;trigger?.focus();}
  by('zoomIn').onclick=()=>setScale(scale()*1.5);by('zoomOut').onclick=()=>setScale(scale()/1.5);by('zoomFit').onclick=fitSource;by('zoomNative').onclick=()=>setScale(1,true);by('modalClose').onclick=closeSource;
  modal.onclick=e=>{if(e.target===modal)closeSource();};
  let drag=null;scroll.onpointerdown=e=>{if(e.pointerType!=='mouse'||e.button!==0||fit)return;e.preventDefault();drag={x:e.clientX,y:e.clientY,left:scroll.scrollLeft,top:scroll.scrollTop};scroll.classList.add('dragging');scroll.setPointerCapture(e.pointerId);};scroll.onpointermove=e=>{if(drag){scroll.scrollLeft=drag.left+drag.x-e.clientX;scroll.scrollTop=drag.top+drag.y-e.clientY;}};scroll.onpointerup=scroll.onpointercancel=()=>{drag=null;scroll.classList.remove('dragging');};
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){if(modal.classList.contains('open'))closeSource();else if(by('detail').classList.contains('open'))closeDetails();else setPoints(false);}
    if(e.key==='Tab'&&modal.classList.contains('open')){const buttons=[...modal.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  by('familyStory').onclick=()=>{
    current=null;clearSelection();for(const row of rows.values()){row.classList.remove('selected');row.setAttribute('aria-pressed','false');}
    by('detail').classList.add('open');document.body.classList.add('detail-open');by('pointnav').hidden=true;
    by('dt').textContent='Daniël · het familieverhaal';by('dd').textContent='1917–1951 en het leven in Nederland';by('evidenceBadge').textContent='Gedocumenteerde levensloop met open vragen';by('evidenceBadge').className='evidence mixed';
    by('storyText').textContent='Daniël kwam uit Ohoirenan op Kei-Besar en trouwde in september 1940 met Orpa Oebra. In augustus 1941 begon zijn militaire dienst op Ambon. Zijn eigen latere verklaring vertelt over gevangenschap, een vlucht per prauw via Ceram, achterblijven in Tual en gevangenschap in Weduar. De datums zijn niet allemaal onafhankelijk bevestigd.\n\nVanaf juli 1946 beschrijft zijn militaire administratie opeenvolgende plaatsingen op Ambon, in Makassar en Pare-Pare, en vervolgens in Oost-Java en Malang. In 1949 werd hij soldaat eerste klasse. De documenten bewijzen geen persoonlijke patrouilles of deelname aan specifieke incidenten tijdens de Indonesische onafhankelijkheidsoorlog.\n\nIn 1950 eindigde zijn KNIL-dienst en verrichtte hij tijdelijk dienst bij de Koninklijke Landmacht. Zijn vervolgblad registreert de Somersetshire-reis naar Nederland: vertrek 9 april 1951 en aankomst 15 mei. De aankomstindex koppelt een echtgenote en vier kinderen aan zijn gezin. Zijn eerste woonvolgorde in Nederland, waaronder Laarbrug en Eerde, blijft een onderzoeksvraag.';
    by('proofSummary').textContent='Open een gebeurtenis in de tijdlijn voor de datum, oorspronkelijke passage en precieze bronverwijzing.';by('locationNote').textContent='';by('routeNote').hidden=true;by('quoteBox').hidden=true;by('fragmentImg').hidden=true;by('storySource').hidden=true;by('fragmentImg').removeAttribute('src');
    renderContext({id:'overview',topics:['personal','occupation','military','independence','voyage','netherlands'],evidence_level:'C'});renderSources({source_ids:['S01','S02','S03','S04','S05','S06','S19','S24','S25']});showTab('story');if(isMobile())setPoints(false);by('detail').scrollTop=0;
  };
  applyLayout(layoutMode);applyFilters();initMap();
})();
