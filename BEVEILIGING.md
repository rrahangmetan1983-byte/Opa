# Besloten familiegeschiedenis

Toegangsvraag: **In welke straat woonde opa Daniel?**

De Node-server controleert het antwoord voordat index.html of een bronafbeelding wordt verstuurd. Het juiste antwoord wordt uitsluitend ingesteld als servergeheim `ACCESS_ANSWER`. Zet het niet in GitHub, een commit, een HTML-bestand of een frontendconfiguratie. Hoofdletters en overtollige spaties worden genegeerd. Een straatnaam kan worden geraden of bekend worden; deze methode deelt één toegangsbewijs met alle bezoekers.

## Wat er is gebouwd

- Bescherming van de pagina, scripts en alle bestanden onder assets; directe afbeeldingslinks vereisen ook een sessie.
- Sessies met willekeurige tokens, vier uur geldigheid, HttpOnly/SameSite-cookies en Secure-cookies in productie; uitloggen trekt de sessie op de server in.
- Maximaal vijf antwoordpogingen per vijftien minuten per rechtstreeks verbonden IP-adres, een limiet op gelijktijdige controles, beperkte formuliergrootte en eenmalige formuliertokens.
- Geen caching van beschermde reacties, geen verwijzende URL naar externe bronnen, geen indexering en blokkering van embedding in frames.
- Drempels tegen tekstselectie, kopiëren, rechtsklikken op inhoud en het slepen van afbeeldingen. Zoekvelden blijven bruikbaar.

Screenshots, OCR en het opslaan van reeds ontvangen bestanden zijn niet te verhinderen. Deze UI-drempels beschermen geen inhoud tegen een ingelogde bezoeker met technische kennis. Reeds gemaakte kopieën en browsercaches van de openbare versie kunnen niet worden ingetrokken.

## Verplicht voor echte afscherming

Deze wijziging werkt **niet als toegangsbeveiliging op GitHub Pages**: daar draait server.mjs niet. Publiceer deze branch daarom niet via Pages en beschouw de huidige openbare versie niet als beveiligd.

1. Maak de bestaande repository privé. De huidige bestanden en de gitgeschiedenis zijn anders publiek te lezen, ook met een beveiligde website.
2. Schakel de oude GitHub Pages-publicatie uit. Een nieuw beveiligd adres sluit het oude adres niet af.
3. Gebruik een hostingomgeving die Node 22 of nieuwer draait, met HTTPS. Configureer `NODE_ENV=production`, `PUBLIC_ORIGIN=https://het-echte-adres`, `ACCESS_ANSWER` als geheim, `HOST=0.0.0.0` indien de host dit vereist en de door de host opgegeven `PORT`.
4. Start met `npm start`. Er zijn geen npm-afhankelijkheden nodig. Configureer bij een reverse proxy ook een inloglimiet aan de rand: de app vertrouwt bewust geen vrij aanpasbare forwardingheaders. Zonder die configuratie kan de app meerdere bezoekers als één IP-adres zien.
5. Controleer zonder sessie de hoofdpagina, index.html, directe afbeeldingslinks en eventuele alternatieve domeinen of previewadressen. Die moeten de vraag of een weigering tonen. Controleer ook dat de oude Pages-site en de publieke GitHub-bestanden niet meer bereikbaar zijn.

De server bewaart sessies en limieten in geheugen en is bedoeld voor één proces. Herstarten logt iedereen uit. Meerdere replicas vereisen gedeelde sessie- en limietopslag. Houd de Node-runtime bijgewerkt en laat de host geen antwoorden, cookies of formulierinhoud loggen. De bestaande externe kaartbibliotheken en kaarttegels blijven externe verzoeken maken.

## Tests

`npm test` controleert anonieme toegang, directe bronlinks, goede en verkeerde antwoorden, cross-site verzoeken, vervalste sessies, uitloggen, verboden bestandspaden, goklimieten en weigering bij ontbrekende productieconfiguratie. De tests gebruiken een fictieve straatnaam. Het echte antwoord is nog niet ingesteld.

Voor productie zijn een mobiele en desktopcontrole op de echte HTTPS-host, sessieverval na vier uur, proxy-instellingen en de afsluiting van de oude openbare routes nog vereist.
