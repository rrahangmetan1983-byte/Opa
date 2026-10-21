# Herindeling militaire loopbaan — 21 oktober 2026

De goedgekeurde mockup is uitgewerkt tot een volledig functionerende website onder de omschrijving **De militaire loopbaan van Daniël Rahangmetang**.

## Gepubliceerde wijzigingen

- `index.html`: nieuwe hoofdnavigatie, militaire omschrijving, toegankelijke pagina-indeling en beeldviewer.
- `styles.css`: de goedgekeurde rustige vormgeving, ruime leesgebieden, mobiele bronkiezer, kaartindeling en zoomvenster.
- `app.js`: zes onderdelen (Loopbaan, Tijdlijn, Kaart, Bronnen, Historische context, Onderzoek); werkende hoofdstukken, filters, deelbare bron-/gebeurtenislinks, een kaartpunt per geregistreerde locatie, en volledige bronpresentaties.
- `research/presentation.json`: redactionele teksten van de vijf goedgekeurde onderdelen met bestaande bronverwijzingen, contextteksten en koppelingen naar bronverschillen.
- `scripts/build-data.py`, `data/research.js`: presentatie-inhoud gekoppeld aan de bestaande onderzoeksdata.
- `research/archiefbronnen-1947.html`, `scripts/build-archive-page.py`: bestaande bronpagina behouden met terugnavigatie naar de nieuwe militaire bronnenweergave.
- `package.json`: projectnaam aangepast naar militaire loopbaan.
- `qa/browser-tests.cjs`, `qa/archive-browser-tests.cjs`, `qa/validate-data.py`, `qa/wait-for-pages.py`, `qa/README.md`, `.github/workflows/validate.yml` en dit verslag: controles bijgewerkt voor de nieuwe indeling, inclusief publicatie van CSS en de oorspronkelijke archiefpagina.

## Behoud en bewijsgrens

Alle 41 gebeurtenissen, 39 bronnen, 11 eenheden, 12 bronverschillen, zes hypotheses en zes gezinsrecords blijven beschikbaar. De onderliggende onderzoeksbestanden en bestaande bronafbeeldingen zijn niet herschreven. De vijf hoofdstukken verwijzen naar bestaande bronnen.

De kaart groepeert registraties per gecontroleerde plaats. Onbekende locaties krijgen geen marker; Ceram blijft uitsluitend een schematisch routepunt zonder bekende landingsplaats. De Suezverbinding blijft een vermoedelijk traject. Persoonlijke verklaringen, eenheidsactiviteiten en historische context behouden hun eigen bewijsgrenzen. De zeven uitsneden worden direct getoond, met transcriptie, kader en apart toegankelijk volledig origineel. Bronnen zonder lokale afbeelding tonen een verwijzing, geen vervangend beeld.

## Controle

- 369 browserasserties voor de zes onderdelen, alle gebeurtenissen en bronnen, zeven uitsneden, originele afbeeldingen, zoom, focusherstel, filters, kaartgroepering en onzekerheidslabels.
- 156 aanvullende browserasserties voor de behouden archiefpagina op vier schermmaten.
- Datavalidatie: relaties, chronologie, vijf hoofdstukken en hun bronverwijzingen; 23 bestaande originele afbeeldingen bytegelijk behouden.
- Integriteit: zeven originele controlesommen en zeven exacte pixeluitsneden.
- JavaScript-syntaxis en controle op onbedoelde witruimte.
- Desktop- en mobiele screenshots visueel beoordeeld voor startpagina, bronweergave en kaart.

Lokale browsercontroles gebruiken Chrome/Playwright met rechtstreeks geopende bestanden wegens de eerder vastgestelde localhost-beperking. GitHub Actions herhaalt de suites via een HTTP-server op de PR en op de gepubliceerde Pages-website na de merge. Mobiele controles zijn schermmaatemulaties, geen tests op fysieke toestellen.
