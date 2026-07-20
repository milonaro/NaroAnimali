# Architettura Database Unificato (MySQL & Firestore)

Questo documento descrive l'architettura unificata del database relazionale principale (**MySQL Aruba / SQLite Local Fallback**) e del database real-time (**Firestore**) convenzionati per l'applicazione **AnimalHub PA**.

Invece di duplicare schemi e dati o purgare tabelle a ogni cambio comune nelle demo, tutte le segnalazioni, i verbali, e le anagrafiche dei vari comuni risiedono permanentemente all'interno di un **unico database relazionale unificato** e di un **unico Firestore**. L'isolamento e la profilazione dei dati per ciascun comune avvengono in modo logico e sicuro tramite la colonna `comune_key`.

---

## 1. Relational Database Schema (MySQL / SQLite Fallback)

Ciascuna tabella è predisposta per supportare più comuni contemporaneamente. Il comune attivo al momento della visualizzazione client o recuperato dalle sessioni dell'utente viene filtrato tramite la colonna `comune_key` (es. `'naro'`, `'agrigento'`, `'canicatti'`, `'favara'`, `'palermo'`).

### 1.1 Tabella Comuni Convenzionati e Geofencing (`comuni`)
Definisce le configurazioni territoriali, i confini, i dati anagrafico-statistici per ciascun comune.
```sql
CREATE TABLE comuni (
    key_name VARCHAR(50) PRIMARY KEY, -- es. 'naro', 'agrigento'
    name VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    radius_km DECIMAL(5, 2) NOT NULL,
    lat_min DECIMAL(10, 8) NOT NULL,
    lat_max DECIMAL(10, 8) NOT NULL,
    lng_min DECIMAL(11, 8) NOT NULL,
    lng_max DECIMAL(11, 8) NOT NULL,
    codice_catastale VARCHAR(10),
    superficie_totale_km2 DECIMAL(10, 2),
    foglio_catastale_hub VARCHAR(50),
    particella_catastale_hub VARCHAR(50),
    estensione_ettari_hub DECIMAL(10, 4),
    dati_catastali_completi TEXT,
    codice_istat VARCHAR(10),
    cap VARCHAR(5),
    prefisso_tel VARCHAR(5),
    sito_web VARCHAR(255),
    pec VARCHAR(255),
    altitudine_m INT,
    zona_sismica VARCHAR(10),
    zona_climatica VARCHAR(5),
    comuni_confinanti TEXT,
    hub_attivo TINYINT(1) DEFAULT 1,
    data_attivazione DATE,
    referente_comune VARCHAR(150),
    tel_referente VARCHAR(20)
);
```

### 1.2 Tabella Configurazione Attiva (`admin_config`)
Mantiene la configurazione attiva del portale o preset correntemente visualizzato.
```sql
CREATE TABLE admin_config (
    key_name VARCHAR(100) PRIMARY KEY, -- es. 'activeComune', 'siteName', 'siteLogo'
    value_data TEXT
);
```

### 1.3 Tabella Ruoli Operatore (`ruoli_operatore`)
Definisce i ruoli operativi nel sistema.
```sql
CREATE TABLE ruoli_operatore (
    ruolo_key VARCHAR(50) PRIMARY KEY,
    descrizione VARCHAR(255) NOT NULL
);
```

### 1.4 Tabella Tipologie Animali (`tipologie_animali`)
```sql
CREATE TABLE tipologie_animali (
    specie_key VARCHAR(50) PRIMARY KEY,
    descrizione VARCHAR(255) NOT NULL
);
```

### 1.5 Tabella Utenti & Operatori (`admin_users`)
Identifica gli operatori del comune, ciascuno profilato e associato a uno o più comuni.
```sql
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'OPERATORE', -- es. 'ADMIN', 'POLIZIA_LOCALE', 'CANILE_SANITARIO', 'VOLONTARIO'
    comune_key VARCHAR(50) DEFAULT 'naro',
    visible_modules TEXT DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL
);
```

### 1.6 Logs di Accesso e Tracciamento
Queste tabelle monitorano gli accessi amministrativi, gli OTP dei cittadini e le visite alle pagine pubbliche dei comuni convenzionati.
```sql
CREATE TABLE admin_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    comune_key VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accesso_riuscito TINYINT(1) DEFAULT 1,
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citizen_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150),
    codice_fiscale VARCHAR(16),
    ip_address VARCHAR(45),
    user_agent TEXT,
    azione VARCHAR(100) DEFAULT 'LOGIN_OTP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE visitor_tracking_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_visited VARCHAR(255),
    referrer VARCHAR(255),
    comune_selezionato VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.7 Profili Anagrafici dei Cittadini (`citizen_profiles`)
Per abilitare l'autenticazione tramite codice OTP e tracciare le anagrafiche dei segnalanti.
```sql
CREATE TABLE citizen_profiles (
    email VARCHAR(150) PRIMARY KEY,
    nome VARCHAR(100),
    cognome VARCHAR(100),
    codice_fiscale VARCHAR(16),
    telefono VARCHAR(30),
    indirizzo VARCHAR(255),
    comune_residenza VARCHAR(100),
    sesso VARCHAR(10),
    comune_nascita VARCHAR(100),
    data_nascita VARCHAR(20),
    is_spid_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.8 Tabella Core Segnalazioni (`segnalazioni`)
Stato dei randagi segnalati dai cittadini sul territorio municipale.
```sql
CREATE TABLE segnalazioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
    codice_tracking VARCHAR(100) UNIQUE NOT NULL,
    specie VARCHAR(50) NOT NULL,
    condizioni VARCHAR(255),
    descrizione TEXT,
    foto_url LONGTEXT,
    latitudine DECIMAL(10, 8) NOT NULL,
    longitudine DECIMAL(11, 8) NOT NULL,
    indirizzo VARCHAR(255),
    stato VARCHAR(50) DEFAULT 'CREATA', -- es. 'CREATA', 'IN_CARICO', 'PULIZIA', 'RISOLTA', 'FUSA'
    urgenza VARCHAR(50) DEFAULT 'NORMALE', -- es. 'BASSA', 'NORMALE', 'ALTA', 'CRITICA'
    email_segnalante VARCHAR(150),
    nome_segnalante VARCHAR(100),
    consenso_privacy TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.9 Tabella Storico Interventi (`interventi_logs`)
Tracciamento granulare di ogni modifica di stato, cambio operatore o nota di intervento.
```sql
CREATE TABLE interventi_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
    segnalazione_codice VARCHAR(100) NOT NULL,
    operatore VARCHAR(100) NOT NULL,
    azione VARCHAR(255) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.10 Tabella Registro Anagrafico Canino/Feline (`registro_anagrafica`)
Anagrafica completa degli animali presi in carico (ospitati, adottabili, sterilizzati).
```sql
CREATE TABLE registro_anagrafica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    microchip VARCHAR(50) UNIQUE NOT NULL,
    comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
    nome VARCHAR(100) NOT NULL,
    specie VARCHAR(50) NOT NULL,
    sesso VARCHAR(10) NOT NULL,
    taglia VARCHAR(50) NOT NULL,
    colore VARCHAR(100) NOT NULL,
    condizioni_sanitarie TEXT,
    stato VARCHAR(50) NOT NULL, -- es. 'ADOTTABILE', 'OSPITE', 'ADOTTATO'
    foto_url LONGTEXT,
    proprietario_email VARCHAR(150),
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.11 Tabella Strutture Convenzionate (`strutture`)
Canili, gattili, cliniche veterinarie convenzionate con ciascun ente locale.
```sql
CREATE TABLE strutture (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- es. 'CANILE', 'GATTILE', 'CLINICA_VET', 'RIFUGIO'
    indirizzo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    capacita_max INT,
    postazioni_occupate INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.12 Tabella Convenzioni Attive (`convenzioni`)
```sql
CREATE TABLE convenzioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    numero_atto VARCHAR(50),
    data_stipula DATE NOT NULL,
    data_scadenza DATE,
    stato VARCHAR(30) DEFAULT 'ATTIVA', -- es. 'ATTIVA', 'SCADUTA', 'RINNOVATA'
    oggetto TEXT,
    importo_annuo DECIMAL(10,2),
    documento_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.13 Tabella Adozioni Animali (`adozioni`)
```sql
CREATE TABLE adozioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    microchip VARCHAR(50) NOT NULL,
    comune_key VARCHAR(50) NOT NULL,
    nome_adottante VARCHAR(150) NOT NULL,
    cognome_adottante VARCHAR(150) NOT NULL,
    cf_adottante VARCHAR(16),
    telefono_adottante VARCHAR(20),
    email_adottante VARCHAR(150),
    indirizzo_adottante VARCHAR(255),
    data_richiesta DATE NOT NULL,
    data_approvazione DATE,
    data_consegna DATE,
    stato VARCHAR(30) DEFAULT 'IN_VALUTAZIONE',
    note_operatore TEXT,
    documento_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.14 Gestione Costi, Tariffe e Fatturazione
Consente il tracciamento dei costi unitari dei canili/servizi per ciascun comune convenzionato e l'emissione dei verbali/fatture elettroniche PA.
```sql
CREATE TABLE tariffario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    servizio_key VARCHAR(80) NOT NULL, -- es. 'CATTURA', 'RICOVERO_GIORNO', 'STERILIZZAZIONE'
    descrizione VARCHAR(255),
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    unita_misura VARCHAR(30) DEFAULT 'cadauno',
    iva_pct DECIMAL(5,2) DEFAULT 22.00,
    attivo TINYINT(1) DEFAULT 1,
    valido_dal DATE NOT NULL,
    valido_al DATE,
    UNIQUE KEY uq_tariffa (comune_key, servizio_key, valido_dal)
);

CREATE TABLE costi_voci (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    servizio_key VARCHAR(80) NOT NULL,
    descrizione VARCHAR(255),
    quantita DECIMAL(10,3) DEFAULT 1.000,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    importo_netto DECIMAL(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario) STORED,
    iva_pct DECIMAL(5,2) DEFAULT 22.00,
    importo_iva DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantita * prezzo_unitario * iva_pct / 100, 2)) STORED,
    importo_lordo DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantita * prezzo_unitario * (1 + iva_pct / 100), 2)) STORED,
    ref_fattura_id INT, -- FK su fatture
    ref_intervento_id INT,
    ref_segnalazione VARCHAR(100),
    ref_microchip VARCHAR(50),
    data_voce DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fatture (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    numero_fattura VARCHAR(50) UNIQUE NOT NULL, -- es. '2026/001/NAR'
    data_emissione DATE NOT NULL,
    data_scadenza DATE,
    periodo_dal DATE,
    periodo_al DATE,
    imponibile DECIMAL(10,2) NOT NULL,
    totale_iva DECIMAL(10,2) NOT NULL,
    totale_fattura DECIMAL(10,2) NOT NULL,
    stato VARCHAR(30) DEFAULT 'EMESSA', -- EMESSA | PAGATA | SCADUTA
    data_pagamento DATE,
    metodo_pagamento VARCHAR(50),
    cig VARCHAR(20), -- Codice Identificativo Gara
    cup VARCHAR(20), -- Codice Unico Progetto
    note TEXT,
    documento_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.15 Tabella Notifiche di Sistema (`notifiche`)
```sql
CREATE TABLE notifiche (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- NUOVA_SEGNALAZIONE | STATO_AGGIORNATO
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT,
    letta TINYINT(1) DEFAULT 0,
    ref_segnalazione VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.16 Tabella Snapshot Statistici Giornalieri (`stats_snapshot_giornaliero`)
Per mantenere traccia storica dell'andamento demografico del randagismo e dei canili senza ricalcolare aggregazioni complesse.
```sql
CREATE TABLE stats_snapshot_giornaliero (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL,
    data_snapshot DATE NOT NULL,
    segnalazioni_totali INT DEFAULT 0,
    segnalazioni_aperte INT DEFAULT 0,
    segnalazioni_in_carico INT DEFAULT 0,
    segnalazioni_risolte INT DEFAULT 0,
    segnalazioni_urgenti INT DEFAULT 0,
    animali_totali INT DEFAULT 0,
    animali_adottabili INT DEFAULT 0,
    animali_ospiti INT DEFAULT 0,
    animali_adottati INT DEFAULT 0,
    animali_cani INT DEFAULT 0,
    animali_gatti INT DEFAULT 0,
    animali_altri INT DEFAULT 0,
    posti_totali INT DEFAULT 0,
    posti_occupati INT DEFAULT 0,
    tasso_occupazione_pct DECIMAL(5,2) DEFAULT 0.00,
    interventi_pianificati INT DEFAULT 0,
    interventi_completati INT DEFAULT 0,
    sterilizzazioni_mese INT DEFAULT 0,
    vaccinazioni_mese INT DEFAULT 0,
    fatturato_mese_corrente DECIMAL(10,2) DEFAULT 0.00,
    incassato_mese_corrente DECIMAL(10,2) DEFAULT 0.00,
    credito_aperto DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_snap (comune_key, data_snapshot)
);
```

### 1.17 Viste KPI Centralizzate
```sql
-- 1. Crediti per comune (Fatture insolute)
CREATE OR REPLACE VIEW v_crediti_per_comune AS
SELECT f.comune_key, c.name AS nome_comune, COUNT(f.id) AS num_fatture_aperte,
       SUM(f.totale_fattura) AS totale_da_incassare, MIN(f.data_scadenza) AS prossima_scadenza,
       SUM(CASE WHEN f.data_scadenza < CURDATE() THEN f.totale_fattura ELSE 0 END) AS totale_scaduto
FROM fatture f JOIN comuni c ON c.key_name = f.comune_key WHERE f.stato NOT IN ('PAGATA', 'ANNULLATA')
GROUP BY f.comune_key, c.name;

-- 2. Costi cumulativi per servizio
CREATE OR REPLACE VIEW v_costi_per_servizio_anno AS
SELECT cv.comune_key, cv.servizio_key, YEAR(cv.data_voce) AS anno, COUNT(*) AS num_prestazioni,
       SUM(cv.quantita) AS quantita_totale, SUM(cv.importo_netto) AS totale_netto, SUM(cv.importo_lordo) AS totale_lordo
FROM costi_voci cv GROUP BY cv.comune_key, cv.servizio_key, YEAR(cv.data_voce);

-- 3. KPIs Dashboard Amministratore
CREATE OR REPLACE VIEW v_kpi_dashboard AS
SELECT c.key_name, c.name AS comune, COUNT(DISTINCT s.id) AS segnalazioni_totali,
       SUM(s.stato NOT IN ('RISOLTA','CHIUSA')) AS segnalazioni_attive,
       SUM(s.urgenza = 'CRITICA' AND s.stato NOT IN ('RISOLTA','CHIUSA')) AS segnalazioni_critiche,
       COUNT(DISTINCT ra.id) AS animali_in_gestione, SUM(ra.stato = 'ADOTTABILE') AS adottabili,
       COALESCE(SUM(st.capacita_max), 0) AS posti_totali, COALESCE(SUM(st.postazioni_occupate), 0) AS posti_occupati,
       COALESCE(ROUND(SUM(st.postazioni_occupate) / NULLIF(SUM(st.capacita_max),0) * 100, 1), 0) AS occupazione_pct,
       COALESCE((SELECT SUM(f2.totale_fattura) FROM fatture f2 WHERE f2.comune_key = c.key_name AND f2.stato NOT IN ('PAGATA','ANNULLATA')), 0) AS credito_aperto_euro
FROM comuni c LEFT JOIN segnalazioni s ON s.comune_key = c.key_name LEFT JOIN registro_anagrafica ra ON ra.comune_key = c.key_name LEFT JOIN strutture st ON st.comune_key = c.key_name
GROUP BY c.key_name, c.name;
```

---

## 2. Real-Time Sync Strategy (Firestore)

Firestore viene impiegato come strato di transito reattivo ad alte prestazioni, ideale per sincronizzare i pin sulla mappa interattiva senza gravare sul database operazionale relazionale.

### 2.1 Struttura Documento Firestore (`/segnalazioni/{id}`)
Ciascun report sincronizzato in tempo reale possiede l'attributo `comuneKey`:
```json
{
  "id": "TRK-2026-N2",
  "comuneKey": "naro",
  "codiceTracking": "TRK-2026-N2",
  "specie": "GATTO",
  "condizioni": "Ferito alla zampa posteriore",
  "descrizione": "Gattino europeo grigio pezzato bianco.",
  "fotoUrl": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
  "latitudine": 37.2915,
  "longitudine": 13.7915,
  "indirizzo": "Via Castello, Naro (AG)",
  "stato": "IN_CARICO",
  "urgenza": "ALTA",
  "createdAt": "2026-06-06T13:13:54Z"
}
```

### 2.2 Isolamento Database ID in Produzione e Sandbox
L'applicazione gestisce dinamicamente l'id database di Firestore:
- **Sandbox AI Studio**: Utilizza il database ID isolato dedicato `ai-studio-animalhubpa-f145a859-0368-41b3-a89f-0b6e524a3625` estratto da `firebase-applet-config.json` per evitare conflitti con altri sviluppi.
- **Produzione (Vercel)**: Utilizza il database specificato nella variabile d'ambiente `FIREBASE_DATABASE_ID` (oppure `VITE_FIREBASE_DATABASE_ID`). Se non specificato, cade sul database standard `(default)` per una configurazione out-of-the-box semplice ed efficiente.

### 2.3 Filtraggio Client Realtime
La mappa interattiva React istanzia un unico listener su Firestore e filtra i record in memoria in base alla preferenza attiva:
```typescript
const activeComuneKey = localStorage.getItem('active_comune') || 'naro';
const activeMarkers = segnalazioni.filter(s => s.comuneKey.toLowerCase() === activeComuneKey.toLowerCase());
```
Questo consente cambi comune istantanei sul client con zero scritture pendenti o ritardi di propagazione.
