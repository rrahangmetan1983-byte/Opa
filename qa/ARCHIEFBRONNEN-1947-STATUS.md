# QA en bronintegratie — Nationaal Archief 2.13.132, inv.nr. 1164

Datum: 20 oktober 2026.

## Vastgestelde situatie

- De pagina `research/archiefbronnen-1947.html` is bereikbaar als repositorybestand en gekoppeld vanuit `index.html`.
- Het originele stamboek staat al in `assets/08-stamboek-volledig.jpg` en is op de pagina opgenomen met een afbeelding en een link voor vergroting.
- De archiefstukken uit 1947 zijn via directe Nationaal Archief-viewerlinks opgenomen; **niet** als lokaal opgeslagen scans.
- De pagina bevat een responsive viewport en een `@media(max-width:600px)`-regel.
- De eerder gebruikte externe iframes zijn verwijderd omdat betrouwbare weergave op andere domeinen niet is vastgesteld.

## Nog niet voltooid — bronafbeeldingen

De daadwerkelijke bronafbeeldingen van de Nationaal Archief-scans 32, 51, 52, 250, 251 en viewer scan 264 (URL-suffix 0268) moeten afzonderlijk worden verkregen als leesbare JPG/PNG of PDF. De aanwezige samengestelde contactafbeelding met miniaturen is hiervoor onvoldoende; die is geen vervanging voor de originele scans.

Voeg alleen daadwerkelijk gedownloade, gecontroleerde bestanden toe onder `assets/archief/2.13.132-1164/` en documenteer per bestand:

1. Archieftoegang, inventarisnummer en viewer-scannummer.
2. De exacte bron-URL (URL-suffix kan afwijken van viewer-scannummer).
3. Beschrijving en bewijsgrens (bataljon versus persoon).
4. Herkomst, rechten en datum van raadpleging.
5. Controle dat de scan volledig en op mobiel leesbaar is.

## Nog niet voltooid — browser/device-tests

De browserconnector was niet beschikbaar in de huidige chatsessie; de gepubliceerde website kon evenmin extern worden geopend. Daarom zijn **geen** echte visuele desktop- of mobiele tests uitgevoerd. Openstaande testgevallen:

- Desktop: breedte 1440 en 1024 px; hoofdkaart, lijst, bronpagina, navigatie en bronafbeeldingen.
- Mobiel: breedte 390 en 360 px; geen horizontale overflow, leesbare bronafbeeldingen, terugnavigatie, bronlinks.
- Openen en zoomen van het stamboek, plus eventuele nieuw toegevoegde scans.
- Externe archieflinks openen correct in nieuw tabblad.
- Kaartmarkers, clusterinteractie, detailscherm en tabs blijven werken na de wijziging.
- Toetsenbordnavigatie en alt-teksten.

## Historische bewijsgrens

- Persoonlijk stamboek: Daniël bij 7-Inf. XV op 13 oktober 1947 en administratieve overgang naar Oost-Java op 21 november 1947.
- Eenheidsrapport: 7-Inf. XV van Pare-Pare naar Soerabaja rond 22 november 1947.
- Eenheidsrapport: Inf. XXIII scheepsgewijs naar Soerabaja op 29 en 30 november 1947.
- Geen van deze eenheidsrapporten bewijst Daniëls aanwezigheid op een specifiek schip of deelname aan een specifieke patrouille.

**Afgerond betekent pas:** originele scans leesbaar als lokale afbeeldingen toegevoegd, bronmetadata gecontroleerd, echte desktop- en mobiele tests uitgevoerd en bevindingen vastgelegd.
