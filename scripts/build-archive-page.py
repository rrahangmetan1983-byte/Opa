"""Build the archive source page from reviewed excerpts and the image manifest."""
from pathlib import Path
import json
from html import escape as e
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'research/archiefbronnen-1947.json').read_text(encoding='utf-8'))
images={r['id']:r for r in json.loads((root/'assets/archief/2.13.132-1164/manifest.json').read_text(encoding='utf-8'))}
old=(root/'research/archiefbronnen-1947.html').read_text(encoding='utf-8')
# Preserve the existing personal source, chronology, December lead and research question.
end_personal='<h2>Originele scans' if '<h2>Originele scans' in old else '<h2>Origineel, uitsnede'
personal=old[old.index('<h2>Persoonlijke primaire bron'):old.index(end_personal)]
chronology=old[old.index('<h2>Persoonlijke chronologie'):old.index('</main>')]
end_december='<h2>Archiefscans:' if '<h2>Archiefscans:' in old else '<h2>Persoonlijke chronologie'
december=old[old.index('<section class="item"><h3>5. Rapport december'):old.index(end_december)]
style='''body{font:16px/1.65 system-ui,Arial,sans-serif;color:#172d44;background:#f5f7f9;margin:0}main{max-width:1100px;margin:auto;padding:24px 18px 65px}h1,h2,h3{line-height:1.3}a{color:#075a91;overflow-wrap:anywhere}nav{padding:12px 18px;background:white}.intro,.item{background:white;border:1px solid #dce3e9;border-radius:12px;padding:20px;margin:18px 0}.warning{border-left:4px solid #ad6b18;padding:12px;background:#fff9ee}.meta,figcaption,small{color:#536b80;font-size:.9em}.images{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:20px;align-items:start}figure{margin:16px 0;min-width:0}img{display:block;max-width:100%;height:auto;border:1px solid #cbd8e3;box-sizing:border-box}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.65 ui-monospace,monospace;background:#f3f6f8;padding:16px;border-radius:8px}section{scroll-margin-top:16px}.links{display:flex;flex-wrap:wrap;gap:12px}:focus-visible{outline:3px solid #ad6b18;outline-offset:3px}@media(max-width:650px){main{padding:16px 12px}.item,.intro{padding:16px}.images{grid-template-columns:minmax(0,1fr)}.original img{max-height:420px;width:auto}pre{font-size:14px}}'''
html=f'''<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Archiefbronnen 1947 – Daniël Rahangmetang</title><style>{style}</style></head><body><nav><a href="../index.html">← Terug naar de tijdlijn en kaart</a></nav><main>
<h1>Archiefbronnen: Celebes en Oost-Java (1947)</h1>
<div class="intro"><p>Zeven door de familie aangeleverde originele archiefscans voor het onderzoek naar <strong>Daniël Rahangmetang (legernummer 171301443)</strong>. Elk origineel is ongewijzigd bewaard. De uitsneden bevatten uitsluitend pixels uit dat origineel: geen kunstmatige vergroting, verscherping of aanvulling. Open een afbeelding voor de volledige resolutie.</p>
<p class="warning"><strong>Bewijsgrens:</strong> het persoonlijke stamboek documenteert Daniëls dienst. Eenheidsrapporten beschrijven militaire onderdelen en gebieden. Zij bewijzen geen persoonlijke deelname aan operaties of transporten.</p>
<p>Transcripties betreffen alleen de geselecteerde passages. Spelling en afkortingen zijn behouden; regelafbrekingen en spatiëring zijn voor leesbaarheid aangepast. Vierkante haken markeren redactionele onzekerheid. Bestandsnummer, gedrukt paginanummer en viewerpositie zijn afzonderlijke aanduidingen. Rapportdata die niet op deze bladen staan zijn niet aangevuld.</p><p><a href="../assets/archief/2.13.132-1164/manifest.json">Bestandsherkomst, afmetingen, uitsnedecoördinaten en SHA-256-controlesommen</a> · <a href="2026-10-12/RECHTEN.md">Reproductieverantwoording</a></p>
<p class="links">{''.join(f'<a href="#scan-{r["id"]}">Scan {r["id"]}</a>' for r in records)}</p></div>
{personal}<h2>Origineel, uitsnede en transcriptie per bron</h2>'''
for r in records:
    m=images[r['id']]; x,y,x2,y2=m['crop_box']; base='../assets/archief/2.13.132-1164/'
    html+=f'''<section class="item" id="scan-{r['id']}"><h3>Scan {r['id']} — {e(r['title'])}</h3>
<p class="meta">Nationaal Archief, Den Haag · toegang 2.13.132 · inventarisnummer 1164 · bestandsidentificatie NL-HaNA_2.13.132_1164_{r['id']} · gedrukte pagina: {e(r['page'])}.</p>
<div class="images"><figure class="original"><a href="{base+m['original']}" target="_blank" rel="noopener"><img loading="lazy" width="{m['width']}" height="{m['height']}" src="{base+m['original']}" alt="Volledig origineel van scan {r['id']}: {e(r['title'])}"></a><figcaption>Volledig origineel · {m['width']} × {m['height']} pixels. <a href="{base+m['original']}" target="_blank" rel="noopener">Open origineel ↗</a></figcaption></figure>
<figure><a href="{base+m['crop']}" target="_blank" rel="noopener"><img loading="lazy" width="{x2-x}" height="{y2-y}" src="{base+m['crop']}" alt="Relevante tekstpassage uit scan {r['id']}; transcriptie hieronder"></a><figcaption>Uitsnede op oorspronkelijke resolutie · {x2-x} × {y2-y} pixels. <a href="{base+m['crop']}" target="_blank" rel="noopener">Open uitsnede ↗</a></figcaption></figure></div>
<h4>Transcriptie van de geselecteerde passage</h4><pre>{e(r['transcript'])}</pre><h4>Historisch kader</h4><p>{e(r['context'])}</p><p class="warning"><strong>Betekenis voor Daniël:</strong> {e(r['boundary'])}</p>
<p class="meta">Herkomst: origineel aangeleverd door de gebruiker in ‘Bronanalyse Infanterie IV’; lokaal gecontroleerd op 21 oktober 2026. <a href="{e(m['source_url'])}" target="_blank" rel="noopener">Exacte bronverwijzing bij het Nationaal Archief ↗</a>. Er is geen vrije licentie op de beelden vastgesteld; zie de reproductieverantwoording.</p></section>'''
html+='<h2>Aanvullende onderzoekslead</h2>'+december+chronology+'</main></body></html>\n'
(root/'research/archiefbronnen-1947.html').write_text(html,encoding='utf-8')
print('Archiefpagina opgebouwd: 7 bronnen, 14 lokale afbeeldingen, 7 transcripties.')
