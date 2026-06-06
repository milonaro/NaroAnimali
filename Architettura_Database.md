# Architettura Database Unificato (MySQL & Firestore)

Questo documento descrive l'architettura unificata del database relazionale principale (**MySQL Aruba / SQLite Local Fallback**) e del database real-time (**Firestore**) convenzionati per l'applicazione **AnimalHub PA**.

Invece di duplicare schemi e dati o purgare tabelle a ogni cambio comune nelle demo, tutte le segnalazioni, i verbali, e le anagrafiche dei vari comuni risiedono permanentemente all'interno di un **unico database relazionale unificato** e di un **unico Firestore**. L'isolamento e la profilazione dei dati per ciascun comune avvengono in modo logico e sicuro tramite la colonna `comune_key`.

---

## 1. Relational Database Schema (MySQL / SQLite Fallback)

Ciascuna tabella è predisposta per supportare più comuni contemporaneamente. Il comune attivo al momento della visualizzazione client o recuperato dalle sessioni dell'utente viene filtrato tramite la colonna `comune_key` (es. `'naro'`, `'agrigento'`, `'canicatti'`, `'favara'`, `'palermo'`).

### 1.1 Tabella Comuni Convenzionati (`comuni`)
Definisce le configurazioni territoriali e di geofencing per ciascun comune.
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
    lng_max DECIMAL(11, 8) NOT NULL
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
    comune_key VARCHAR(50) DEFAULT 'naro'
);
```

### 1.6 Tabella Core Segnalazioni (`segnalazioni`)
Stato del randagismo sul territorio.
```sql
CREATE TABLE segnalazioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
    codice_tracking VARCHAR(100) UNIQUE NOT NULL,
    specie VARCHAR(50) NOT NULL,
    condizioni VARCHAR(255),
    descrizione TEXT,
    foto_url TEXT,
    latitudine DECIMAL(10, 8) NOT NULL,
    longitudine DECIMAL(11, 8) NOT NULL,
    indirizzo VARCHAR(255),
    stato VARCHAR(50) DEFAULT 'CREATA', -- es. 'CREATA', 'IN_CARICO', 'PULIZIA', 'RISOLTA'
    urgenza VARCHAR(50) DEFAULT 'NORMALE', -- es. 'BASSA', 'NORMALE', 'ALTA', 'CRITICA'
    email_segnalante VARCHAR(150),
    nome_segnalante VARCHAR(100),
    consenso_privacy TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 1.7 Tabella Storico Interventi (`interventi_logs`)
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

### 1.8 Tabella Registro Anagrafico Canino/Feline (`registro_anagrafica`)
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
    foto_url TEXT,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.9 Tabella Strutture Convenzionate (`strutture`)
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

### 2.2 Filtraggio Client Realtime
La mappa interattiva React istanzia un unico listener su Firestore e filtra i record in memoria in base alla preferenza attiva:
```typescript
const activeComuneKey = localStorage.getItem('active_comune') || 'naro';
const activeMarkers = segnalazioni.filter(s => s.comuneKey.toLowerCase() === activeComuneKey.toLowerCase());
```
Questo consente cambi comune istantanei sul client con zero scritture pendenti o ritardi di propagazione.
