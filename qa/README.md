# Controles militaire loopbaan

`python qa/validate-data.py` controleert bron- en locatierelaties, chronologie, bewijsniveaus, zes gezinsrecords, 24 oorspronkelijke records en bytegelijk behoud van de 23 oorspronkelijke bronafbeeldingen. Ook de bronverwijzingen in de vijf hoofdstukken en contextteksten worden gecontroleerd.

`python qa/validate-archive.py` controleert zeven originele SHA-256-hashes en zeven exacte pixeluitsneden. Hiervoor is Pillow nodig.

`python scripts/build-data.py` bouwt de browserdata uit de onderzoeksbestanden en `research/presentation.json`.

Start een lokale webserver vanuit de repository (`python -m http.server 8765`) en voer `node qa/browser-tests.cjs` en `node qa/archive-browser-tests.cjs` uit. Playwright is een ontwikkelafhankelijkheid; de publieke website heeft geen npm-build nodig.

De hoofdtest doorloopt zes onderdelen, alle 41 gebeurtenissen, alle 39 bronnen en de zeven uitsneden. Hij controleert filters, bronkoppelingen, originele afbeeldingen, native beeldresolutie, focusherstel, gegroepeerde kaartplaatsen, Ceram zonder verzonnen landingsmarker en de expliciet vermoedelijke Suezroute. Formaten: 1440 × 1000, 1024 × 900, 390 × 844, 360 × 740 en 844 × 390. Mobiele selectie brengt de leestekst in beeld en gebruikt een compacte bronkiezer.

De archieftest controleert aanvullend alle zeven bronsecties en veertien afbeeldingen op de bestaande archiefpagina, op 1440, 1024, 390 en 360 px.

Gebruik `KNIL_TEST_URL` om dezelfde controles op GitHub Pages te draaien. `qa/wait-for-pages.py` vergelijkt gepubliceerde HTML, JavaScript, CSS en onderzoeksdata met de checkout. Kaarttegelstatus wordt afzonderlijk gelogd. Screenshots en JSON-resultaten worden in GitHub Actions bewaard als artifact `browser-evidence`.
