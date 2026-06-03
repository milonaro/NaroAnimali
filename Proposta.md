# Moduli Proposti - Versione Base (Affidamento Diretto)

## 1. Portale Segnalazioni Cittadini

### Funzionalità

Il cittadino può effettuare una segnalazione tramite smartphone o PC indicando:

- posizione GPS automatica;
- indirizzo del ritrovamento;
- fotografie;
- eventuali video;
- descrizione dell'evento;
- tipologia della segnalazione.

### Tipologie

- Cane vagante
- Cane ferito
- Cucciolata
- Cane aggressivo
- Presunto abbandono
- Animale deceduto
- Altro

### Processo di Validazione

Ogni segnalazione viene sottoposta ad un processo automatico di verifica composto da tre livelli.

#### Livello 1 - Controlli automatici

La piattaforma effettua verifiche sui dati presenti nel database Firebase Firestore:

- ricerca segnalazioni duplicate;
- verifica di segnalazioni già aperte nella stessa area;
- verifica della presenza di animali già censiti;
- verifica di interventi già programmati;
- verifica della qualità minima delle informazioni ricevute.

#### Livello 2 - Analisi AI

Un modulo di Intelligenza Artificiale analizza:

- immagini caricate;
- descrizione testuale;
- geolocalizzazione;
- storico delle segnalazioni.

L'AI assegna:

- livello di attendibilità;
- livello di urgenza;
- classificazione preliminare del caso.

Possibili esiti:

- Alta priorità
- Media priorità
- Bassa priorità
- Richiesta di verifica

#### Livello 3 - Validazione Operatore

L'operatore comunale visualizza:

- dati inseriti dal cittadino;
- esito controlli automatici;
- valutazione AI;
- eventuali segnalazioni correlate.

L'operatore può:

- approvare;
- richiedere integrazioni;
- archiviare;
- assegnare l'intervento.

### Benefici

- riduzione delle segnalazioni duplicate;
- riduzione del carico operativo;
- maggiore qualità dei dati raccolti;
- migliore pianificazione degli interventi;
- tracciabilità dell'intero processo.


#### workflow

Cittadino
    ↓
Portale Web
    ↓
Firebase Firestore
    ↓
Controlli automatici
    ↓
AI Classifier
    ↓
Coda validazione operatore
    ↓
Intervento
    ↓
Reportistica


#### Sistema Antifrode e Anti-Spam

rilevamento segnalazioni ripetitive;
rilevamento fotografie duplicate;
verifica coordinate GPS;
blacklist automatica utenti abusivi;
scoring di affidabilità del segnalante.




# Moduli Opzionali e Sviluppi Futuri

## Premessa

La piattaforma è progettata secondo un'architettura modulare che consente l'attivazione progressiva di nuove funzionalità in base alle esigenze operative del Comune e alle risorse economiche disponibili.

I seguenti moduli non fanno parte della versione iniziale e potranno essere implementati successivamente.

---

# Modulo A - Gestione Adozioni

## Obiettivo

Favorire l'adozione degli animali recuperati e ridurre i costi di permanenza presso strutture convenzionate.

## Funzionalità

* Pubblicazione animali adottabili.
* Scheda completa dell'animale.
* Galleria fotografica.
* Richiesta di adozione online.
* Gestione colloqui preliminari.
* Tracciamento dell'iter di affido.
* Storico delle adozioni concluse.

## Benefici

* Riduzione del numero di animali ospitati.
* Maggiore trasparenza verso i cittadini.
* Riduzione dei costi di mantenimento.

---

# Modulo B - Gestione Associazioni Animaliste

## Obiettivo

Favorire la collaborazione tra Comune e associazioni di volontariato.

## Funzionalità

* Accessi dedicati.
* Consultazione pratiche autorizzate.
* Inserimento aggiornamenti.
* Gestione volontari.
* Condivisione documentazione.
* Monitoraggio animali affidati alle associazioni.

## Benefici

* Migliore coordinamento operativo.
* Riduzione dei tempi di gestione.
* Tracciabilità delle attività svolte.

---

# Modulo C - Gestione Sterilizzazioni

## Obiettivo

Monitorare e programmare le attività di controllo delle nascite.

## Funzionalità

* Calendario interventi.
* Pianificazione campagne di sterilizzazione.
* Registro animali sterilizzati.
* Archivio interventi veterinari.
* Report annuali.

## Benefici

* Riduzione progressiva del fenomeno del randagismo.
* Supporto alla programmazione delle attività comunali.
* Produzione di statistiche territoriali.

---

# Modulo D - Archivio Fotografico Intelligente

## Obiettivo

Creare una banca dati fotografica degli animali censiti.

## Funzionalità

* Archiviazione immagini.
* Associazione immagini agli animali censiti.
* Ricerca fotografica assistita da AI.
* Confronto con segnalazioni ricevute.

## Benefici

* Individuazione più rapida degli animali già censiti.
* Riduzione delle duplicazioni.
* Migliore qualità dei dati raccolti.

---

# Modulo E - Mappa Territoriale Interattiva

## Obiettivo

Visualizzare il fenomeno del randagismo sul territorio comunale.

## Funzionalità

* Mappa GIS.
* Cluster delle segnalazioni.
* Zone ad alta frequenza.
* Storico degli interventi.
* Heatmap territoriale.

## Benefici

* Migliore pianificazione delle attività.
* Individuazione delle aree critiche.
* Supporto alle decisioni amministrative.

---

# Modulo F - App Mobile Operatori

## Obiettivo

Consentire la gestione operativa direttamente sul territorio.

## Funzionalità

* Accesso da smartphone e tablet.
* Aggiornamento pratiche in tempo reale.
* Acquisizione foto geolocalizzate.
* Firma digitale degli interventi.
* Consultazione storico segnalazioni.

## Benefici

* Riduzione delle attività amministrative.
* Aggiornamento immediato dei dati.
* Migliore coordinamento operativo.

---

# Modulo G - Dashboard Amministrativa Avanzata

## Obiettivo

Fornire agli amministratori comunali strumenti avanzati di monitoraggio.

## Funzionalità

* Indicatori di performance.
* Statistiche annuali.
* Analisi dei costi.
* Tempi medi di intervento.
* Report automatici.

## Benefici

* Supporto alle decisioni strategiche.
* Migliore controllo delle risorse impiegate.
* Monitoraggio dell'efficacia delle politiche comunali.

---

# Modulo H - Integrazione SPID e CIE

## Obiettivo

Consentire l'identificazione certa dei cittadini che effettuano segnalazioni.

## Funzionalità

* Accesso tramite SPID.
* Accesso tramite Carta d'Identità Elettronica.
* Associazione automatica dell'identità digitale alle segnalazioni.

## Benefici

* Maggiore affidabilità delle informazioni ricevute.
* Riduzione delle segnalazioni anonime o non verificabili.
* Conformità agli standard della Pubblica Amministrazione.

---

# Modulo I - Sistema AI Predittivo

## Obiettivo

Supportare il Comune nell'individuazione preventiva delle aree maggiormente interessate dal fenomeno.

## Funzionalità

* Analisi storica delle segnalazioni.
* Individuazione delle aree a rischio.
* Analisi delle ricorrenze territoriali.
* Prioritizzazione automatica degli interventi.

## Benefici

* Ottimizzazione delle risorse.
* Migliore programmazione operativa.
* Riduzione dei tempi di risposta.

---

# Modulo L - Portale Trasparenza e Open Data

## Obiettivo

Pubblicare dati statistici aggregati sul fenomeno del randagismo.

## Funzionalità

* Report pubblici.
* Statistiche aggregate.
* Cruscotti informativi.
* Download dati aperti.

## Benefici

* Maggiore trasparenza amministrativa.
* Coinvolgimento della cittadinanza.
* Valorizzazione delle attività svolte dal Comune.
