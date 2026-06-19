// Regolamenti comunali e leggi regionali ufficiali inerenti il randagismo e la tutela animale.
// Questo archivio funge da base di dati documentale (Knowledge Base) passata all'AI (Gemini) per istruire la "Guida Intelligente".

export interface RegolamentoDocumento {
  titolo: string;
  identificativo: string;
  dataSorgente: string;
  puntiChiave: string[];
  testoIntegrale: string;
}

export const REGOLAMENTI_CONTESTO: RegolamentoDocumento[] = [
  {
    titolo: "Regolamento del Comune di Naro per la Prevenzione del Randagismo e Tutela degli Animali",
    identificativo: "REG-CC-NARO-N42",
    dataSorgente: "Deliberazione Consiglio Comunale n. 42 del 12/03/2021",
    puntiChiave: [
      "Iscrizione anagrafe canina obbligatoria entro 60 giorni dalla nascita o possesso.",
      "Sanzioni amministrative da 150€ a 450€ in caso di mancata microchippatura.",
      "Regolamento per colonie feline: divieto assoluto di maltrattamento o allontanamento, censimento ufficiale.",
      "Obbligo di condurre i cani al guinzaglio (lunghezza max 1.5 metri) e museruola in caso di aggressività.",
      "Raccolta obbligatoria delle deiezioni canine con sanzione di 100€ per i trasgressori."
    ],
    testoIntegrale: `
REGOLAMENTO COMUNALE DEL COMUNE DI NARO (AGIGENTO)
Art. 1 - Finalità ed Ambito di Applicazione
Il Comune di Naro promuove la tutela del benessere degli animali d'affezione e previene il randagismo sul proprio territorio, ritenendo che il rispetto della vita animale sia elemento fondamentale di civiltà e progresso biologico.

Art. 5 - Anagrafe Canina ed Identificazione Obbligatoria
1. Ogni cane deve essere identificato tramite inoculazione di microchip ed iscritto all'Anagrafe Canina Regionale entro il sessantesimo giorno di vita (60 giorni) o entro 10 giorni dall'inizio del possesso da parte di qualsiasi cittadino residente a Naro.
2. La mancata iscrizione comporta una sanzione amministrativa pecuniaria variabile da € 150,00 a € 450,00. Alla violazione consegue il sequestro temporaneo del cane ai fini dell'applicazione del microchip a spese del contravventore presso l'ambulatorio convenzionato del Comune o i locali ASP.

Art. 12 - Conduzione di Animali nei Luoghi Pubblici
1. Nelle vie pubbliche, piazze e parchi del territorio di Naro è obbligatorio condurre i cani con un guinzaglio di lunghezza non superiore a metri 1,50. È inoltre obbligatorio avere con sé una museruola (da applicare in caso di potenziale pericolo o su richiesta delle Forze dell'Ordine).
2. I proprietari o detentori di cani hanno l'obbligo tassativo di raccogliere le deiezioni solide prodotte dagli stessi su tutto il suolo pubblico urbano. I trasgressori sono puniti con sanzione amministrativa di € 100,00.

Art. 18 - Colonie Feline e Protezione dei Gatti Randagi
1. I gatti che vivono in stato di libertà sul territorio comunale sono protetti. È vietato a chiunque ostacolarne l'alimentazione, maltrattarli, catturarli o allontanarli dal loro habitat naturale (colonia felina).
2. Le colonie feline presenti a Naro vengono censite d'ufficio, anche su segnalazione di associazioni volontarie o singoli cittadini (referenti di colonia). L'ASP di Agrigento provvede alla sterilizzazione gratuita dei gatti e alla successiva reintroduzione nella colonia d'appartenenza.
3. Lo spostamento di una colonia felina dal proprio insediamento è consentito solo per gravi motivi di igiene pubblica o di incolumità dei gatti stessi, previa autorizzazione dell'Ufficio Ecologia del Comune e parere favorevole del veterinario ASP.

Art. 24 - Protocollo di Gestione Cani Vaganti (Accalappiamento e Ricovero)
1. I cani vaganti sul territorio comunale, qualora sprovvisti di proprietario o protetti ma vaganti senza controllo, vengono segnalati tramite lo sportello comunale "AnimalHub PA" (Modulo A).
2. La Polizia Municipale o i volontari d'intesa coordinano il prelievo dell'animale che viene trasferito presso il Canile Sanitario convenzionato per gli accertamenti medici, le vaccinazioni e l'eventuale sterilizzazione a carico delle finanze del bilancio comunale.
3. Se nessun proprietario ne rivendica lo smarrimento entro 10 giorni dall'accalappiamento, l'animale è dichiarato formalmente adottabile. L'ente promuove attivamente le adozioni responsabili dei cani custoditi tramite contributi straordinari o percorsi semplificati.
`
  },
  {
    titolo: "Legge Regionale Siciliana 3 luglio 2000, n. 15 - Norme per la limitazione delle nascite e tutela degli animali",
    identificativo: "LRS-N15-2000",
    dataSorgente: "Gazzetta Ufficiale della Regione Siciliana n. 32 del 07/07/2000",
    puntiChiave: [
      "Inoculazione obbligatoria del microchip fornito dalle ASP territoriali siciliane.",
      "Istituzione del fondo regionale per la prevenzione del randagismo.",
      "Divieto assoluto di soppressione dei cani ricoverati nei rifugi veterinari pubblici, salvo casi di incurabilità grave.",
      "Sterilizzazione obbligatoria quale mezzo primario di controllo demografico della specie canina vagante."
    ],
    testoIntegrale: `
LEGGE REGIONALE SICILIANA n. 15 del 3 luglio 2000
Istituzione dell'anagrafe canina e norme per la tutela degli animali d'affezione e la prevenzione del randagismo.

Art. 2 - Anagrafe canina ed obblighi dei proprietari
1. È istituita presso le Unità Operative di Sanità Pubblica Veterinaria delle Aziende Sanitarie Locali (ASP) della Regione Siciliana l'anagrafe canina informatizzata.
2. I proprietari di cani, i possessori a qualsiasi titolo e gli allevatori hanno l'obbligo di iscrivere i propri animali all'anagrafe del comune di residenza entro due mesi dalla nascita o entro dieci giorni dal possesso.
3. Il veterinario accreditato o ufficiale della ASP che procede all'iscrizione provvede contestualmente all'inoculazione sottocutanea del microchip identificativo sul lato sinistro del collo del cane.
4. Ogni variazione di proprietà, cambio di residenza, smarrimento o decesso dell'animale deve essere denunciato all'anagrafe canina entro quindici giorni dall'evento.

Art. 6 - Divieto di soppressione e sterilizzazione
1. I cani vaganti catturati o ritrovati non possono essere soppressi, tranne nei casi di malattie clinicamente incurabili, comprovata aggressività patologica e ineluttabile accertata da apposita commissione veterinaria ASP.
2. Il controllo demografico della popolazione canina vagante è effettuato mediante la sterilizzazione chirurgica effettuata dai medici veterinari della ASP o dei canili sanitari convenzionati. I cani sterilizzati, qualora descritti come mansueti e non aggressivi, possono essere reintrodotti sul territorio, diventando 'Cani di Quartiere' sotto la vigilanza del Comune e delle associazioni protezioniste.
`
  },
  {
    titolo: "Disciplinare Comunale d'Affido e Integrazione del Certificato COF (Codice Opzione Famiglia)",
    identificativo: "DISC-COF-NARO",
    dataSorgente: "Linee Guida del Sottosettore Randagismo e Digitalizzazione P.A. 2025",
    puntiChiave: [
      "Il COF (Codice Opzione Famiglia) è la firma digitale e verbale ufficiale del Comune di Naro per l'adozione.",
      "Consente l'esonero per 3 anni del pagamento della micro-tassa sui servizi ambientali (TARI) per chi adotta un cane dal canile convenzionato.",
      "Stabilisce un rigido schema di controlli post-affido a cura delle guardie zoofile convenzionate o volontari rionali."
    ],
    testoIntegrale: `
DISCIPLINARE TECNICO DEL COMUNE DI NARO SULL'ADOZIONE DI ANIMALI RECLUSI IN CANILI CONVENZIONATI

Art. 3 - Definizione del COF (Codice Opzione Famiglia)
1. Il Codice Opzione Famiglia (COF) rappresenta l'atto giuridico ed informatico emesso dal Comune di Naro per certificare il passaggio di tutela di un cane randagio catturato nel territorio comunale e ospitato nel canile sanitario convenzionato, ad una famiglia ospitante.
2. Il certificato COF è munito di id digitale univoco e viene registrato all'interno del database del Fascicolo Cittadino (La Mia Area), legando stabilmente l'adottante al record del cane nel registro nazionale.

Art. 7 - Incentivi Economici per l'Adozione Responsabile
1. Per contrastare l'alto costo di stazionamento dei cani randagi presso i canili convenzionati (con un risparmio stimato di circa € 1.200 all'anno per singolo cane a carico del bilancio comunale), il Comune di Naro incentiva le adozioni responsabili dei propri cani.
2. Ciascun cittadino residente a Naro che adotta un cane registrato a nome del Comune riceve l'esonero totale della quota comunale della tariffa sui rifiuti urbani (TARI) per un periodo continuativo di 3 anni, a partire dall'anno d'affido, previa verifica della sussistenza dello stato di benessere dell'animale.

Art. 10 - Controlli Post-Affido e Revoca della Custodia
1. Le associazioni animaliste convenzionate con il Comune, d'intesa con le Guardie Particolari Giurate Zoofile, eseguono controlli domiciliari periodici (almeno due visite nel primo anno e controlli a campione negli anni successivi) per verificare le condizioni sanitarie ed ambientali dell'animale adottato col COF.
2. Nel caso si riscontrassero abusi, malnutrizione, detenzione a catena o assenza di cure essenziali, il Comune provvede all'immediata revoca del COF e dell'affidamento. L'animale viene prelevato coattivamente e l'adottante viene denunciato per il reato di maltrattamento di animali (Art. 727 c.p.) oltre a perdere definitivamente l'incentivo fiscale.
`
  }
];
