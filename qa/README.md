# Controles

`python qa/validate-data.py` controleert bron- en locatierelaties, chronologische volgorde (ook maand- en jaarintervallen), alle vier bewijsniveaus, gecorrigeerde kernmutaties, zes gezinsrecords en bytegelijk behoud van de 23 oorspronkelijke bronafbeeldingen.

`node qa/browser-tests.cjs` gebruikt een echte Chromium-browser. Start eerst `python -m http.server 8765` vanuit de repository. Playwright is een ontwikkelafhankelijkheid; de publieke website heeft geen npm-build nodig.

De browsercontrole selecteert alle 41 gebeurtenissen, vergelijkt de precieze bron-ID’s, test de zes onderwerpen en vier bewijsniveaus, synchronisatie met markers, lege zoekresultaten, gefilterde vorige/volgende, hypotheselocaties zonder marker, het Sueztraject, bronzoomen, toetsenbordfocus en desktop/mobiel. Mobiele formaten: 360×740, 390×844, 430×932 en 844×390.

De test registreert kaarttegels afzonderlijk van bronbeelden. Een externe tilefout is geen ontbrekende familiebron. TLS-controle blijft ingeschakeld. GitHub Actions bewaart screenshots en een JSON-resultaat als artifact `browser-evidence`.

De bestaande `responsive.html` blijft beschikbaar voor handmatige indelingscontrole.
