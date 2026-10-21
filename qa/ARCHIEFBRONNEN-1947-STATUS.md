# Bronintegratie 1947 — controleverslag

Gecontroleerd op 21 oktober 2026.

## Bestanden en inhoud

- `research/archiefbronnen-1947.html`: zeven bronsecties met origineel, uitsnede, transcriptie, kader, bewijsgrens en exacte archieflink. Persoonlijke bron, chronologie, decemberlead en onderzoeksvraag behouden.
- `research/archiefbronnen-1947.json`: handmatig gelezen transcripties en toelichtingen, inclusief onzekere lezingen.
- `assets/archief/2.13.132-1164/`: voor elk nummer 0032, 0051, 0052, 0250, 0251, 0268 en 0270 het bestand `NL-HaNA_2.13.132_1164_NUMMER.jpg` en `NL-HaNA_2.13.132_1164_NUMMER-uitsnede.png`; daarnaast `manifest.json` met SHA-256, afmetingen, pixelcoördinaten, herkomst en bronlinks.
- `research/2026-10-12/data/sources.json`: bronnen S33–S39; bestandsidentificatie en gedrukte pagina gescheiden.
- `research/2026-10-12/data/events.json`: E020 aanvullend gekoppeld aan S36/S37 en E021 aan S38/S39. Persoonlijke datums, bewijsniveaus en stamboekcitaten behouden.
- `data/research.js`, `scripts/build-data.py`: bronbeelden geïntegreerd in bestaande bronvensters; expliciete UTF-8-verwerking.
- `app.js`, `research/2026-10-12/RECHTEN.md`: bronpaginaverwijzing en reproductieverantwoording, zonder vrije licentie te claimen.
- `scripts/build-archive-page.py`, `scripts/build-archive-crops.py`: reproduceerbare pagina en verliesvrije uitsneden.
- `qa/validate-archive.py`, `qa/archive-browser-tests.cjs`, `qa/validate-data.py`, `.github/workflows/validate.yml`, `.gitignore` en dit verslag: integriteitscontrole, browsercontrole en automatische herhaling op PR en main.

## Geslaagde lokale controles

- Zeven oorspronkelijke SHA-256-controles en zeven exacte pixelvergelijkingen van uitsneden. Geen resampling, retouche of verscherping.
- Bronpagina: 156 browserasserties bij 1440 × 900, 1024 × 900, 390 × 900 en 360 × 900. Alle veertien afbeeldingen laden, transcripties en bewijsgrenzen aanwezig, uitsneden openen op volle resolutie, terugnavigatie werkt, geen horizontale paginaoverflow of browserfouten.
- Bestaande applicatie: 145 browserasserties voor 41 gebeurtenissen, filters, bronkoppelingen, kaartselectie, routes, bronvensters, toetsenbord en vier mobiele schermmaten. 12 kaarttegels geladen, 0 mislukt.
- Datavalidatie: 41 gebeurtenissen, 39 bronnen, bron- en plaatsrelaties, chronologie, vier bewijsniveaus, zes transportrecords, 24 oude records; 23 bestaande originele afbeeldingen ongewijzigd.
- JavaScript-syntaxis gecontroleerd. Desktop- en mobiele detailbeelden van scan 0250 visueel bekeken: origineel en uitsnede zichtbaar, tekst en links binnen het scherm.

Lokale browser: Chrome via Playwright, direct geopende bestanden. De lokale HTTP-preview was vanuit deze omgeving onbereikbaar. GitHub Actions herhaalt beide browsersuites via HTTP op de PR en via de gepubliceerde Pages-URL op main. Schermmaatemulaties zijn geen tests op fysieke telefoons. Screenshots en JSON-testresultaten zijn lokaal beschikbaar; Actions bewaart deze als testartifact.

## Historische afbakening

Scan 0250 noemt Inf XV, XVI en XXIII; de eerdere titel met XVII bij deze scan is gecorrigeerd. Het stamboek noemt 21 november voor de administratieve overgang naar Oost-Java; scan 0250 meldt 22 november voor 7-Inf XV. Scan 0268 meldt Inf XXIII scheepsgewijs op 29–30 november. Geen individuele reisdatum, schip of deelname aan operaties is hiermee bewezen.

Datering van bladen 0032/0051/0052 blijft open; de eerdere juni-datering is niet als zelfstandig geverifieerd overgenomen. Onzekere letters en plaatsnamen zijn expliciet gemarkeerd. Onderzoek naar persoonlijke transportorders en de betekenis van M.C. blijft nodig.
