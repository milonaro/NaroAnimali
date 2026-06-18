import pool, { getIsMysqlHealthy, setMysqlHealthy } from "./mysql.js";
import admin from "firebase-admin";

export async function addMySQLColumns() {
  const columnsToAdd = [
    { name: "codice_catastale", typeMysql: "VARCHAR(10)" },
    { name: "superficie_totale_km2", typeMysql: "DECIMAL(10, 2)" },
    { name: "foglio_catastale_hub", typeMysql: "VARCHAR(50)" },
    { name: "particella_catastale_hub", typeMysql: "VARCHAR(50)" },
    { name: "estensione_ettari_hub", typeMysql: "DECIMAL(10, 4)" },
    { name: "dati_catastali_completi", typeMysql: "TEXT" },
    // Aggiunti per ANIMALHUB PA - AGGIORNAMENTO
    { name: "codice_istat", typeMysql: "VARCHAR(10)" },
    { name: "cap", typeMysql: "VARCHAR(5)" },
    { name: "prefisso_tel", typeMysql: "VARCHAR(5)" },
    { name: "sito_web", typeMysql: "VARCHAR(255)" },
    { name: "pec", typeMysql: "VARCHAR(255)" },
    { name: "altitudine_m", typeMysql: "INT" },
    { name: "zona_sismica", typeMysql: "VARCHAR(10)" },
    { name: "zona_climatica", typeMysql: "VARCHAR(5)" },
    { name: "comuni_confinanti", typeMysql: "TEXT" },
    { name: "hub_attivo", typeMysql: "TINYINT(1)" }, 
    { name: "data_attivazione", typeMysql: "DATE" },
    { name: "referente_comune", typeMysql: "VARCHAR(150)" },
    { name: "tel_referente", typeMysql: "VARCHAR(20)" }
  ];

  if (pool && getIsMysqlHealthy()) {
    for (const col of columnsToAdd) {
      try {
        await pool.execute(`ALTER TABLE comuni ADD COLUMN ${col.name} ${col.typeMysql}`);
        console.log(`MySQL: aggiunta colonna ${col.name} a comuni`);
      } catch (e: any) {
        if (!e.message.includes("Duplicate column") && !e.message.includes("already exists")) {
          console.warn(`Info migrazione MySQL colonna ${col.name}:`, e.message);
        }
      }
    }

    try {
      await pool.execute("ALTER TABLE admin_users ADD COLUMN visible_modules TEXT DEFAULT NULL");
      console.log("MySQL: aggiunta colonna visible_modules a admin_users");
    } catch (e: any) {
      if (!e.message.includes("Duplicate column") && !e.message.includes("already exists")) {
        console.warn("Info migrazione MySQL colonna visible_modules:", e.message);
      }
    }

    try {
      await pool.execute("ALTER TABLE admin_users ADD COLUMN email VARCHAR(150) DEFAULT NULL");
      // Seed un'email di default per gli utenti di test per far funzionare l'OTP
      await pool.execute("UPDATE admin_users SET email = CONCAT(username, '@animalhub.it') WHERE email IS NULL");
      console.log("MySQL: aggiunta colonna email a admin_users");
    } catch (e: any) {
      if (!e.message.includes("Duplicate column") && !e.message.includes("already exists")) {
        console.warn("Info migrazione MySQL colonna email:", e.message);
      }
    }

    try {
      await pool.execute("ALTER TABLE adozioni ADD COLUMN creato_da VARCHAR(150) DEFAULT NULL");
      console.log("MySQL: aggiunta colonna creato_da a adozioni");
    } catch (e: any) {
      if (!e.message.includes("Duplicate column") && !e.message.includes("already exists")) {
        console.warn("Info migrazione MySQL colonna creato_da a adozioni:", e.message);
      }
    }

    try {
      await pool.execute("ALTER TABLE adozioni ADD COLUMN modificato_da VARCHAR(150) DEFAULT NULL");
      console.log("MySQL: aggiunta colonna modificato_da a adozioni");
    } catch (e: any) {
      if (!e.message.includes("Duplicate column") && !e.message.includes("already exists")) {
        console.warn("Info migrazione MySQL colonna modificato_da a adozioni:", e.message);
      }
    }
  }
}

export async function createMySQLTables() {
  if (!pool || !getIsMysqlHealthy()) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS admin_config (
        key_name VARCHAR(100) PRIMARY KEY,
        value_data TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'OPERATORE',
        comune_key VARCHAR(50) DEFAULT 'naro',
        visible_modules TEXT DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS registro_anagrafica (
        id INT AUTO_INCREMENT PRIMARY KEY,
        microchip VARCHAR(50) UNIQUE NOT NULL,
        comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
        nome VARCHAR(100),
        specie VARCHAR(50),
        sesso VARCHAR(10),
        taglia VARCHAR(50),
        colore VARCHAR(100),
        condizioni_sanitarie TEXT,
        stato VARCHAR(50),
        foto_url TEXT,
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS interventi_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
        segnalazione_codice VARCHAR(100),
        operatore VARCHAR(100),
        azione TEXT,
        note TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS segnalazioni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
        codice_tracking VARCHAR(100) UNIQUE,
        specie VARCHAR(50),
        condizioni VARCHAR(255),
        descrizione TEXT,
        foto_url TEXT,
        latitudine DECIMAL(10, 8),
        longitudine DECIMAL(11, 8),
        indirizzo VARCHAR(255),
        stato VARCHAR(50) DEFAULT 'CREATA',
        urgenza VARCHAR(50) DEFAULT 'NORMALE',
        email_segnalante VARCHAR(150),
        nome_segnalante VARCHAR(100),
        consenso_privacy TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS comuni (
        key_name VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        radius_km DECIMAL(5, 2) NOT NULL,
        lat_min DECIMAL(10, 8) NOT NULL,
        lat_max DECIMAL(10, 8) NOT NULL,
        lng_min DECIMAL(11, 8) NOT NULL,
        lng_max DECIMAL(11, 8) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS ruoli_operatore (
        ruolo_key VARCHAR(50) PRIMARY KEY,
        descrizione VARCHAR(150) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS tipologie_animali (
        specie_key VARCHAR(50) PRIMARY KEY,
        descrizione VARCHAR(150) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS strutture (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
        nome VARCHAR(150) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        indirizzo VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        capacita_max INT,
        postazioni_occupate INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    // Nuove Tabelle per ANIMALHUB PA
    `CREATE TABLE IF NOT EXISTS convenzioni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        struttura_id INT,
        tipo_servizio VARCHAR(100),
        data_inizio DATE,
        data_fine DATE,
        importo_annuo DECIMAL(10,2),
        stato VARCHAR(50) DEFAULT 'ATTIVA',
        documento_url TEXT,
        FOREIGN KEY (struttura_id) REFERENCES strutture(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS notifiche (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        destinatario_email VARCHAR(150) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titolo VARCHAR(255),
        messaggio TEXT,
        letta TINYINT(1) DEFAULT 0,
        data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS adozioni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registro_id INT NOT NULL,
        comune_key VARCHAR(50) NOT NULL,
        adottante_nome VARCHAR(150),
        adottante_cf VARCHAR(16),
        adottante_tel VARCHAR(20),
        adottante_email VARCHAR(150),
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        stato VARCHAR(50) DEFAULT 'IN_VALUTAZIONE',
        esito VARCHAR(50),
        note TEXT,
        creato_da VARCHAR(150) DEFAULT NULL,
        modificato_da VARCHAR(150) DEFAULT NULL,
        FOREIGN KEY (registro_id) REFERENCES registro_anagrafica(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS calendari_intervento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        tipo_intervento VARCHAR(100),
        descrizione TEXT,
        data_prevista DATE,
        stato VARCHAR(50) DEFAULT 'PIANIFICATO',
        operatori_assegnati VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS tariffario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        voce_servizio VARCHAR(150) NOT NULL,
        costo_unitario DECIMAL(10,2) NOT NULL,
        unita_misura VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS costi_voci (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        intervento_log_id INT,
        voce_servizio VARCHAR(150),
        quantita DECIMAL(10,2) DEFAULT 1,
        costo_totale DECIMAL(10,2),
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS fatture (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        fornitore VARCHAR(150) NOT NULL,
        numero_fattura VARCHAR(50),
        data_emissione DATE,
        importo_totale DECIMAL(10,2),
        stato VARCHAR(50) DEFAULT 'DA_PAGARE',
        documento_url TEXT,
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS stats_snapshot_giornaliero (
        data DATE PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        tot_cani INT DEFAULT 0,
        tot_gatti INT DEFAULT 0,
        interventi_eseguiti INT DEFAULT 0,
        adozioni_concluse INT DEFAULT 0,
        spese_giornaliere DECIMAL(10,2) DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS user_otps (
        email VARCHAR(150) PRIMARY KEY,
        otp_code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS admin_access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        comune_key VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        accesso_riuscito TINYINT(1) DEFAULT 1,
        note VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS citizen_access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150),
        codice_fiscale VARCHAR(16),
        ip_address VARCHAR(45),
        user_agent TEXT,
        azione VARCHAR(100) DEFAULT 'LOGIN_OTP',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS visitor_tracking_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        page_visited VARCHAR(255),
        referrer VARCHAR(255),
        comune_selezionato VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS adozioni_operazioni_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
        adozione_id INT,
        operatore VARCHAR(100),
        operazione VARCHAR(50),
        dettagli TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const q of queries) {
      try {
        await pool.execute(q);
      } catch (err) {
          console.error("Errore init DB MySQL: ", err);
      }
  }

  // Create Views
  const views = [
      `CREATE OR REPLACE VIEW v_crediti_per_comune AS SELECT comune_key, COUNT(*) as totale_crediti FROM convenzioni WHERE stato='ATTIVA' GROUP BY comune_key`,
      `CREATE OR REPLACE VIEW v_costi_per_servizio_anno AS SELECT comune_key, voce_servizio, SUM(costo_totale) as totale, YEAR(data_registrazione) as anno FROM costi_voci GROUP BY comune_key, voce_servizio, anno`,
      `CREATE OR REPLACE VIEW v_kpi_dashboard AS SELECT comune_key, 'adozioni' as kpi, COUNT(*) as valore FROM adozioni WHERE esito='APPROVATA' GROUP BY comune_key UNION SELECT comune_key, 'segnalazioni_aperte', COUNT(*) FROM segnalazioni WHERE stato IN ('CREATA', 'IN_CARICO') GROUP BY comune_key`,
      `CREATE OR REPLACE VIEW v_trend_segnalazioni_mensile AS SELECT comune_key, YEAR(created_at) as y, MONTH(created_at) as m, COUNT(*) as totale FROM segnalazioni GROUP BY comune_key, y, m`,
      `CREATE OR REPLACE VIEW v_trend_fatturazione_mensile AS SELECT comune_key, YEAR(data_emissione) as y, MONTH(data_emissione) as m, SUM(importo_totale) as totale FROM fatture GROUP BY comune_key, y, m`
  ];

  for (const v of views) {
      try {
          await pool.execute(v);
      } catch (e: any) {
             console.log("View creation error (often unsupported or syntax locally, skipping):", e.message);
      }
  }
}
