# Guida di Installazione e Configurazione Territoriale - AnimalHub PA

Questo manuale è progettato per gli amministratori di sistema, il personale ICT della Pubblica Amministrazione ed i tecnici incaricati di attivare, configurare e personalizzare le istanze comunali (comuni convenzionati) all'interno di **AnimalHub PA**.

La guida descrive in dettaglio la gestione dei parametri territoriali, del geofencing geografico (raggio di intervento, confini della mappa), delle schede catastali dell'Hub e la procedura per modificare questi parametri sia direttamente dal Database (backend SQL) sia dall'interfaccia web di amministrazione (Super-CMS).

---

## 1. Architettura Territoriale e Geofencing

L'applicazione utilizza un meccanismo di **geofencing protettivo** per garantire che i cittadini possano inviare segnalazioni esclusivamente all'interno del territorio di competenza dell'ente. Questo previene l'inserimento di segnalazioni mendaci o fuori provincia.

Le coordinate e i confini geografici sono memorizzati nella tabella `comuni` di MySQL ed esposti al frontend tramite l'API `/api/comuni`. Il file di configurazione client `src/lib/geofence.ts` agisce come proxy dinamico per intercettare la selezione dell'utente e applicare i vincoli geografici.

### Parametri Chiave del Territorio Comunale (Tabella `comuni`)
Ogni comune è descritto da una riga nel database che include i seguenti campi geometrici ed amministrativi:

| Nome Colonna (MySQL) | Tipo di Dato | Descrizione Funzionale |
| :--- | :--- | :--- |
| **`key_name`** | `VARCHAR(50)` | Identificativo univoco in lettere minuscole (es. `'naro'`, `'canicatti'`, `'agrigento'`). Funge da chiave primaria. |
| **`name`** | `VARCHAR(100)` | Nome esteso e ufficiale mostrato all'utente (es. `'Naro'`, `'Canicattì'`). |
| **`lat`** | `DECIMAL(10,8)` | Latitudine del centro geografico del comune (utilizzata come centro per il calcolo delle distanze). |
| **`lng`** | `DECIMAL(11,8)` | Longitudine del centro geografico del comune. |
| **`radius_km`** | `DECIMAL(5,2)` | **Raggio d'azione massimo** in chilometri. Definisce la barriera virtuale di geofencing. |
| **`lat_min`**, **`lat_max`** | `DECIMAL(10,8)` | Limiti latitudinali (Minimo e Massimo) per inquadrare e centrare la mappa interattiva. |
| **`lng_min`**, **`lng_max`** | `DECIMAL(11,8)` | Limiti longitudinali (Minimo e Massimo) per inquadrare e centrare la mappa interattiva. |
| **`superficie_totale_km2`**| `DECIMAL(10,2)` | **Superficie del territorio comunale** espressa in chilometri quadrati ($km^2$). |
| **`codice_catastale`** | `VARCHAR(10)` | Codice catastale dell'ente (es. `'F845'` per Naro, `'A089'` per Agrigento). |
| **`foglio_catastale_hub`**| `VARCHAR(50)` | Identificativo del Foglio Catastale dove ha sede l'Hub di Soccorso. |
| **`particella_catastale_hub`**| `VARCHAR(50)` | Identificativo della Particella Catastale associata all'Hub. |
| **`estensione_ettari_hub`**| `DECIMAL(10,4)` | Estensione superficiale dell'Hub espressa in ettari ($ha$). |
| **`dati_catastali_completi`**| `TEXT` | Dettaglio descrittivo e note legali o di esenzione d'uso pubblico dell'Hub. |

---

## 2. Come Funziona l'Abilitazione e il Geofencing sulle Mappe

Quando un cittadino accede alla sezione **"Segnala"** o consulta la **"Mappa"**, il sistema esegue i seguenti calcoli in tempo reale:

### A. Validazione "In Territorio" (Geofencing Radiante)
La funzione `isInTerritorio(lat, lng)` calcola la distanza geometrica tra le coordinate del marker inserito dall'utente e il centro del comune attivo, utilizzando la formula di Haversine (distanza ortodromica in km sulla sfera terrestre):

$$d = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

Se la distanza $d$ calcolata è minore o uguale al valore impostato nel campo `radius_km` (es. `8.00` per Naro o `12.00` per Agrigento), la segnalazione viene accettata. In caso contrario, il sistema blocca l'inserimento mostrando un avviso di fuori territorio.

### B. Classificazione Automatica delle Zone d'Intervento
A seconda della distanza dal centro comunale, la funzione `getZona(lat, lng)` ripartisce automaticamente la segnalazione in quattro distinte macro-aree territoriali utili alla pianificazione dei soccorsi:
* **`0 km` a `1 km`**: Classificato come **CENTRO** (intervento urbano rapido).
* **`1 km` a `3 km`**: Classificato come **PERIFERIA** (intervento stradale esterno).
* **`3 km` a `6 km`**: Classificato come **CAMPAGNA** (intervento extraurbano o agricolo).
* **Oltre `6 km`**: Classificato come **CONTRADA** (intervento rurale fitta forestazione/campi).

---

## 3. Gestione e Modifica dei Dati da Backend (Database SQL)

Tutti i dati geografici e amministrativi risiedono nella tabella MySQL `comuni`. Di seguito sono riportati i comandi SQL per eseguire modifiche singole, aggiungere territori o alterare i metri/chilometri quadrati coperti.

### A. Modifica Singola di un Parametro (es. Aumento Superficie o Raggio)
Per espandere la superficie del territorio coperto o allargare il raggio di geofencing per ricevere le segnalazioni più lontano:

```sql
-- 1. Aumentare la superficie totale del territorio comunale (es. Naro portata a 207.49 km²)
UPDATE comuni 
SET superficie_totale_km2 = 207.49 
WHERE key_name = 'naro';

-- 2. Estendere il raggio del geofencing da 8.0 a 10.5 km per accogliere segnalazioni da aree limitrofe
UPDATE comuni 
SET radius_km = 10.50 
WHERE key_name = 'naro';

-- 3. Modificare e allargare i limiti massimi e minimi della mappa (Map Bounds) per consentire la navigazione
UPDATE comuni 
SET lat_min = 37.22, lat_max = 37.38, lng_min = 13.70, lng_max = 13.90
WHERE key_name = 'naro';
```

### B. Inserimento Completo di un Nuovo Comune Convenzionato
Per abilitare un nuovo comune all'interno della piattaforma, basta inserire una riga completa specificando i rispettivi identificativi geografici e catastali:

```sql
INSERT INTO comuni (
  key_name, name, lat, lng, radius_km, 
  lat_min, lat_max, lng_min, lng_max, 
  codice_catastale, superficie_totale_km2, 
  foglio_catastale_hub, particella_catastale_hub, 
  estensione_ettari_hub, dati_catastali_completi
) VALUES (
  'licata', 
  'Licata', 
  37.1025, 
  13.9378, 
  9.00, -- Raggio Geofence di 9.00 km
  37.0500, -- lat_min
  37.1500, -- lat_max
  13.8800, -- lng_min
  13.9900, -- lng_max
  'E573', -- Codice Catastale
  124.47, -- Superficie Totale in km²
  '14', -- Foglio catastale dell'Hub
  '552', -- Particella catastale dell'Hub
  1.5000, -- Estensione Hub in Ettari (ha)
  'Hub di Soccorso Sanitario costiero Licata. Presidio sterilizzazioni ASP.'
);
```

---

## 4. Gestione e Modifica dei Dati dal Pannello Amministrativo (Web CMS)

L'applicazione integra un potente pannello di gestione visuale (**Centro di Controllo Ente**) accessibile agli amministratori accreditati tramite l'indirizzo `/admin/config`.

### Passi per modificare i dati in tempo reale dall'interfaccia:

1. **Accesso Amministratore**: Accedi alla piattaforma con un utente avente ruolo `ADMIN`.
2. **Naviga nel Centro di Controllo**: Nel menù o nella dashboard operativa seleziona "Impostazioni Ente" (indirizzo `/admin/config`).
3. **Seleziona il Comune**: Usa il selettore **"Seleziona Comune Associato"** per scambiare il comune corrente. L'interfaccia caricherà istantaneamente la scheda catastale, la superficie in $km^2$ e le coordinate territoriali salvate.
4. **Sblocco Sezione Superadmin (Super-CMS)**:
   * Scorri fino alla sezione evidenziata in nero denominata **"SEZIONE SUPERADMIN (SUPER-CMS)"**.
   * Inserisci la password di sicurezza: `superadmin2026`.
   * Clicca su **"Sblocca Strumenti CMS"**.
5. **Modifica dei Campi Istituzionali**:
   * Una volta sbloccata, potrai modificare istantaneamente:
     * **Nome Ente Personalizzato** (es. "Comune di Naro").
     * **Stemma Comune (Logo URL)**: URL dell'emblema ufficiale dell'ente.
     * **Indirizzo della Sede Legale, CAP e Provincia**.
     * **Email, PEC di protocollo e Centralino**.
     * **Numeri Telefonici di Pronto Intervento** (Veterinario Convenzionato, Polizia Municipale e Volontari) che compaiono sulle mappe e nelle emergenze.
     * **Sliders e Banner in Evidenza**: È possibile creare, riordinare o eliminare le schede illustrative della Home Page modificando titoli, descrizioni, bottoni e immagini sia in lingua italiana sia in inglese.
6. **Salvataggio**: Fai clic su **"Salva Impostazioni"** per memorizzare definitivamente i dati nel DB. L'applicazione si ricaricherà applicando la nuova configurazione in tempo reale su tutte le sessioni utente.

---

## 5. Setup ed Installazione dell'Infrastruttura (Nuova Istanza)

Se devi installare una nuova istanza autonoma di AnimalHub PA da zero, il tecnico deve configurare l'infrastruttura Cloud Firebase e il Database MySQL:

### Passo 1: Configurazione Cloud Primaria (Firebase Console)
1. Apri la [Console Firebase](https://console.firebase.google.com) ed aggiungi un nuovo progetto (es. `animalhub-comune-licata`).
2. Sotto **Build**, abilita **Cloud Firestore** in modalità produzione ed imposta la regione geografica su `europe-west3 (Frankfurt)` per garantire la conformità GDPR.
3. Abilita **Authentication** e attiva il provider di accesso **"E-mail/Password"** o **"Link e-mail (OTP)"** per consentire l'accesso sicuro dei cittadini.

### Passo 2: Regole di Sicurezza di Firestore
Nel tab "Rules" di Cloud Firestore nella console, copia ed incolla le seguenti regole protettive:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /segnalazioni/{document} {
      allow read: if true; // Chiunque può vedere i marker dei randagi sulla mappa
      allow create: if true; // Chiunque può inviare una segnalazione (cittadino)
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin'; // Solo amministratori registrati
    }
    match /registro_anagrafica/{document} {
      allow read: if request.auth != null; // Lettura solo a utenti autenticati via OTP
      allow create: if request.auth != null; 
      allow update, delete: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

### Passo 3: Inizializzazione delle Chiavi locali
Nel terminale della nuova installazione, esegui il comando interattivo per inserire le credenziali di Firebase e MySQL:
```bash
npm run setup
```
Questo scriverà automaticamente i file `.env` e configurerà le variabili per connettere l'applicazione al database di riferimento dell'ente.

### Passo 4: Compilazione e Avvio
```bash
npm run build   # Compila il server Express e il client React statico
npm start       # Avvia il portale operativo sulla porta standard 3000
```

---

## 6. Personalizzazione e Logiche Territoriali Avanzate

### A. Soglie di Distanza Ortodromica Personalizzate (Zonizzazione)
Per adattarsi a comuni di diverse dimensioni (es. la vasta estensione territoriale di Agrigento contro la densità di Naro), le fasce di distanza dal centro geografico sono state rese dinamiche e proporzionali nel modulo `src/lib/geofence.ts`.

Se non diversamente specificato tramite parametri espliciti a livello di record database, il sistema calcola la classificazione ortodromica ripartendola in proporzione al raggio massimo del comune (`radius_km`):
* **Soglia CENTRO**: $12.5\%$ del raggio d'intervento (es. raggio 8km = entro 1.0km; raggio 24km = entro 3.0km).
* **Soglia PERIFERIA**: $37.5\%$ del raggio d'intervento (es. raggio 8km = entro 3.0km; raggio 24km = entro 9.0km).
* **Soglia CAMPAGNA**: $75.0\%$ del raggio d'intervento (es. raggio 8km = entro 6.0km; raggio 24km = entro 18.0km).
* **Fascia CONTRADA**: Qualsiasi distanza superiore alle soglie precedenti.

È possibile forzare soglie fisse inserendo nel database le colonne `threshold_centro_km`, `threshold_periferia_km`, e `threshold_campagna_km` nella tabella `comuni` per il comune desiderato.

### B. Personalizzazione Dinamica dei Verbali PDF (Branding Istituzionale)
I PDF generati per le ricevute cittadine o i verbali ufficiali utilizzano i metadati del comune attivo per mantenere un design istituzionale coerente.
* L'intestazione superiore del documento imposta dinamicamente la dicitura `"CITTÀ DI [NOME_COMUNE]"` in base al comune attivo ricavato da `getActiveComune().name`.
* I dettagli del centralino, dell'email PEC e dei contatti d'emergenza in calce al verbale riflettono fedelmente i dati configurati nel pannello amministrativo (CMS), evitando placeholders rigidi o non professionali.
* **Anonimato Pubblico delle Segnalazioni**: Al fine di rispettare il GDPR e salvaguardare la riservatezza, le viste pubbliche (Home, Mappa interattiva) nascondono del tutto l'identità del segnalante, mentre i verbali PDF ufficiali e le schede visibili nell'area operatori autenticati mostrano le credenziali complete per consentire il corretto svolgimento delle attività amministrative e di vigilanza.
