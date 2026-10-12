# Fase 1 — inventarisatie en voorstel

Uitgangspunt: commit `89af319c68fe631de8f48ec3a3cdc15bf2994948`, branch `main`. Bij afsluiting van de inventarisatie was `index.html` bytegelijk aan deze commit. Onderzoeksbestanden zijn tijdens de eerdere onderzoeksopdracht toegevoegd; er is geen tweede extern Deep Research-rapport aangeleverd. De invoer voor verwerking is het daadwerkelijk in deze sessie gecontroleerde dossier en RAPPORT.md.

## Aanwezige website

Statische Nederlandstalige website: één HTML-bestand (68.481 bytes), 24 gebeurtenissen in JavaScript, 23 lokale bronafbeeldingen, Leaflet 1.9.4 en MarkerCluster 1.5.3. Geen package.json, buildstap of eigen Actions-workflow. De bestaande GitHub Pages-configuratie publiceert vanuit `main`, root `/`, via `pages-build-deployment`.

Aanwezig: desktop/mobielschakelaar, zoekvak, drie periodefilters, drie moderne kaartlagen, markerclustering en spiderfy, drie detailtabs, bronmodal met slepen/zoomen/focustrap, vorige/volgende en volledige-routeknop. `qa/responsive.html` geeft handmatige indelingsdiagnostiek in vijf formaten; geen automatische assertions.

## Inhoudelijke verschillen

| Onderwerp | Bestaande weergave | Gecontroleerde invoer / actie |
|---|---|---|
| Melding Ambon | 6 juli 1946 | 10 juli 1946 in origineel en uittreksel |
| September 1946 | 4 september, XX | Origineel 24 september, XXI; uittreksel 14 september, XX. Beide zichtbaar |
| Makassar | 7 oktober 1946 | 17 oktober 1946 |
| Pare-Pare | 3 november 1946 | 23 november 1946 |
| Reorganisatie 7-Inf. XV | 3 oktober 1947 | 13 oktober 1947 |
| Oost-Java | 1 november 1947 | 21 november 1947 |
| Inf. XXIII | IIe compagnie | Letterlijk M.C.; interpretatie apart |
| Rang | Niet als zelfstandig punt | Soldaat eerste klasse, 15 november 1949 |
| KNIL-ontslag | Ontbreekt | Persoonlijke registratie 25 juli 1950 |
| Geboorte/huwelijk/onderwijs | Ontbreekt | Jaar 1917; huwelijksdatum 20 september 1940; zes jaar Maleise school |
| Gevangenschap | “Erkende verklaring” | Geen erkenningsbesluit gezien; persoonlijke verklaring met dateringsbeperking |
| Routes | Doorlopende rechte lijnen | Alle verbindingslijnen schematisch labelen; Suez als aannemelijk traject |
| Laarbrug/Eerde | Ontbreekt | Alleen onderzoeksaanknopingspunten; geen bevestigde woonchronologie |
| Legernummer index | Geen waarschuwing bij vergelijking | Foutveld expliciet uitsluiten; canoniek 171301443 |
| Bronnen | Brede galerijen per periode | Bron-ID per gebeurtenis, archief/scan, passage en bewijsgrens |

Dezelfde stadscoördinaten komen meermalen voor. Dat is voor verschillende gebeurtenissen op dezelfde standplaats correct; deze gebeurtenissen niet samenvoegen. Wel onderscheid maken tussen een geografische verplaatsing en een administratieve wijziging op dezelfde plaats.

## Technische risico's die de implementatie moet oplossen

De huidige filters verbergen alleen zijbalkregels; markers en routes blijven zichtbaar. “Vorige/volgende” volgt alle gebeurtenissen, ook bij een actief filter. Iedere gebeurtenis verwacht verplichte lat/lng en afbeelding: hiaten kunnen daardoor ten onrechte een marker krijgen. De route van Jakarta naar Amsterdam is een rechte lijn zonder Suez. Bewijsbadges hebben drie categorieën en maken zelfstandige getuigenverklaringen te stellig. Historische kaartkoppelingen zijn geen georeferentie.

## Implementatievoorstel

Behoud de bestaande vormgeving, bronmodal en kaartbediening. Gebruik gescheiden, versieerbare data voor gebeurtenissen, bronnen, locaties, eenheden, hypotheses en conflicten. Voeg zes onderwerpfilters en vier bewijsniveaus toe. Laat onbekende locaties zonder marker zien; laat getuigenplaatsen alleen met globale plaatscoördinaten en label zien. Synchroniseer filters, markers, schematische verbindingen en vorige/volgende.

Gebruik voor de scheepsreis een expliciet vermoedelijk traject via Suez; geen gedateerde tussenhavenmarkers zonder bewijs. Toon per bron originele korte passage, eventuele vertaling, instelling, archieftoegang, inventarisnummer, scan en bewijsgrens. Presenteer eenheidscontext afzonderlijk van Daniëls eigen verhaal.

Werk op `feature/knil-research-2026-10-12`. Controleer dat alle bestaande assets blijven bestaan, datarelaties kloppen, datums chronologisch sorteren en onbekende locaties niet worden verzonnen. Test bronmodal, filters, clustering en navigatie met een echte browser in desktop, mobiel en liggend formaat. Na geslaagde tests: PR, controle van actuele head, merge volgens geldende GitHub-regels en controle van de bestaande Pages-build en live website.
