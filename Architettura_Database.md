# Architettura Database MySQL (Aruba)

Questo documento descrive la struttura del database relazionale principale per l'applicazione **AnimalHub PA**. Come da architettura delineata, Firestore verrà mantenuto esclusivamente come strato di transito per i dati real-time (es. notifiche e pin sulla mappa), mentre **MySQL** sarà la vera sorgente dati permanente da interrogare.

## Credenziali di Accesso

```env
# Configurazione per Node.js (es. mysql2 / TypeORM / Prisma)
DB_HOST=31.11.38.16
DB_NAME=Sql1906971_1
DB_USER=Sql1906971
DB_PASS=*********
DB_PORT=3306
```

## Struttura Tabelle (Schema DDL)

Questo script SQL definisce la struttura delle tabelle e le relative chiavi esterne per mantenere l'integrità referenziale.

```sql
-- 1. Tabella Utenti (Operatori, Amministratori e Veterinari del Comune)
CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    ruolo ENUM('ADMIN', 'OPERATORE', 'VETERINARIO', 'VOLONTARIO') DEFAULT 'OPERATORE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabella Segnalazioni (Il core dell'applicativo)
CREATE TABLE segnalazioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codice_tracking VARCHAR(50) UNIQUE NOT NULL,
    specie VARCHAR(50) NOT NULL,
    taglia VARCHAR(50),
    colore VARCHAR(50),
    condizioni VARCHAR(100),
    descrizione TEXT,
    foto_url VARCHAR(255),
    latitudine DECIMAL(10, 8) NOT NULL,
    longitudine DECIMAL(11, 8) NOT NULL,
    indirizzo VARCHAR(255),
    stato ENUM('CREATA', 'IN_CARICO', 'INTERVENTO', 'RISOLTA', 'CHIUSA') DEFAULT 'CREATA',
    urgenza ENUM('BASSA', 'NORMALE', 'ALTA', 'CRITICA') DEFAULT 'NORMALE',
    email_segnalante VARCHAR(255),
    nome_segnalante VARCHAR(100),
    cognome_segnalante VARCHAR(100),
    consenso_privacy BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabella Interventi (Storico delle azioni compiute sulle segnalazioni)
CREATE TABLE interventi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    segnalazione_id INT NOT NULL,
    utente_id INT, -- Può essere null se l'utente viene eliminato, mantenendo lo storico
    note TEXT NOT NULL,
    stato_precedente ENUM('CREATA', 'IN_CARICO', 'INTERVENTO', 'RISOLTA', 'CHIUSA'),
    stato_nuovo ENUM('CREATA', 'IN_CARICO', 'INTERVENTO', 'RISOLTA', 'CHIUSA') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segnalazione_id) REFERENCES segnalazioni(id) ON DELETE CASCADE,
    FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE SET NULL
);

-- 4. Tabella Strutture (Canili, Gattili, Cliniche convenzionate)
CREATE TABLE strutture (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    tipo ENUM('CANILE', 'GATTILE', 'CLINICA_VET', 'RIFUGIO') NOT NULL,
    indirizzo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    capacita_max INT,
    postazioni_occupate INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Relazioni

- **`interventi` ➔ `segnalazioni`**: Relazione 1 a Molti (Una segnalazione ha molti interventi di registro log). Se viene rimossa una segnalazione, l'integrità rimuove gli interventi associati (`ON DELETE CASCADE`).
- **`interventi` ➔ `utenti`**: Relazione 1 a Molti (Un utente compie più interventi). 

## Query per Inserimento Dati Demo

Esegui queste query per popolare il database Aruba e verificare l'architettura.

```sql
-- Dati Demo: Utenti
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo) VALUES 
('Mario', 'Rossi', 'mario.rossi@comune.naro.it', '$2a$10$xyz...', 'ADMIN'),
('Luigi', 'Verdi', 'luigi.verdi@comune.naro.it', '$2a$10$xyz...', 'OPERATORE'),
('Giulia', 'Bianchi', 'giulia.bianchi@vetnaro.it', '$2a$10$xyz...', 'VETERINARIO');

-- Dati Demo: Segnalazioni
INSERT INTO segnalazioni (
    codice_tracking, specie, taglia, colore, condizioni, descrizione, 
    foto_url, latitudine, longitudine, indirizzo, stato, urgenza, 
    email_segnalante, nome_segnalante, cognome_segnalante, consenso_privacy
) VALUES 
('NARO-2026-0001', 'CANE', 'MEDIA', 'Nero focato', 'FERITO', 'Cane zoppicante sul ciglio della strada', 
 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', 37.29120000, 13.79150000, 'Via Cavour 15, Naro', 'CREATA', 'ALTA', 
 'cittadino1@gmail.com', 'Francesco', 'Tese', 1),

('NARO-2026-0002', 'GATTO', 'PICCOLA', 'Tigrato', 'ABBANDONATO', 'Scatolone con gattini vicino ai cassonetti', 
 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 37.29450000, 13.79320000, 'Via Kennedy, Naro', 'IN_CARICO', 'NORMALE', 
 'cittadino2@gmail.com', 'Anna', 'Gialli', 1);

-- Dati Demo: Interventi (Log delle azioni)
INSERT INTO interventi (segnalazione_id, utente_id, note, stato_precedente, stato_nuovo) VALUES 
(1, 2, 'Presa in carico la segnalazione, inviata pattuglia per verifica sul posto.', 'CREATA', 'IN_CARICO'),
(2, 2, 'Recuperati e portati al gattile.', 'CREATA', 'IN_CARICO'),
(2, 3, 'Visita di base effettuata, gattini in salute.', 'IN_CARICO', 'RISOLTA');

-- Dati Demo: Strutture
INSERT INTO strutture (nome, tipo, indirizzo, telefono, capacita_max, postazioni_occupate) VALUES 
('Canile Comprensoriale Dogland', 'CANILE', 'Contrada Zaffuti, Naro', '0922 123456', 150, 120),
('Oasi Felina La Coda', 'GATTILE', 'Via Agrigento, Naro', '0922 654321', 50, 30);
```

## Strategia di Sincronizzazione (Firestore Realtime)

Quando si svilupperà il Backend Node.js per interfacciarsi con queste tabelle, la procedura di immissione sarà:

1. **Inserimento in MySQL**: Il backend Node.js (usando `mysql2`) riceve la POST e fa la query `INSERT` su Aruba. Convalida la transazione.
2. **Aggiornamento Firebase**: Immediatamente dopo il successo (e avendo il nuovo `insertId`), il backend Node.js inserisce un documento estremamente sfoltito su Firestore.
   *Esempio Documento Firebase:*
   ```json
   {
      "sql_id": 1,
      "codice_tracking": "NARO-2026-0001",
      "latitudine": 37.2912,
      "longitudine": 13.7915,
      "specie": "CANE",
      "stato": "CREATA",
      "urgenza": "ALTA"
   }
   ```
3. **Ascolto Client**: La Mappa React ascolta i documenti limitati da Firestore, assicurando rendering in tempo reale senza dover sovraccaricare il DB SQL tramite polling. Il record completo viene poi recuperato dal DB MySQL solo al click del marker sulla Mappa.
