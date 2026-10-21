# Kaart en routes als vertrekpunt

De website opent op de kaart met periodekeuze, zoekveld en één puntenpaneel. Verhaal, bron en context staan in drie tabs. De bron-tab toont de relevante archiefuitsnede en opent het bestaande beeldvenster. De tijdlijn en vijf hoofdstukken blijven bereikbaar.

De publieke leesversie wordt opgebouwd uit research/publicatie.json. Zes gebeurtenissen met niveau D en drie catalogusleads komen niet in deze leesversie. Onderzoeksvragen, conflicten en werkaantekeningen worden niet geladen. De onderzoeksbestanden blijven in de repository bewaard; de persoonlijke backlog is lokaal buiten de repository opgeslagen. GitHub Pages sluit de onderzoeksdata en het oude rapport uit van de publicatie.

De prauwroute blijft een schematische weergave van de eigen verklaring. De Somersetshire-lijn verbindt alleen vertrek en aankomst; de onbevestigde Suezroute is verwijderd. Persoonlijke registraties, eigen verklaringen en eenheidscontext blijven kort herkenbaar.

Controle: qa/browser-tests.cjs controleert de nieuwe hoofdweergave, selectie, vorige/volgende, bronbeelden, context, periodes, zoeken, kaartlagen, certificaten en vijf schermformaten. Bij HTTP-controle moeten de echte kaarttegels laden. qa/archive-browser-tests.cjs controleert alle zeven bronnen en veertien beelden op vier breedtes. De datavalidatie controleert zowel het volledige onderzoek als de selectie voor publicatie.
