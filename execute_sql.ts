import pool from "./src/lib/mysql";

async function run() {
  if (!pool) {
    console.error("No pool");
    return;
  }
  
  try {
    const queries = [
      "UPDATE comuni SET superficie_totale_km2 = 207.49 WHERE key_name = 'naro'",
      "UPDATE comuni SET superficie_totale_km2 = 244.57 WHERE key_name = 'agrigento'",
      "UPDATE comuni SET superficie_totale_km2 = 91.40 WHERE key_name = 'canicatti'",
      "UPDATE comuni SET superficie_totale_km2 = 25.23 WHERE key_name = 'portoempedocle'",
      `ALTER TABLE comuni 
        ADD COLUMN IF NOT EXISTS codice_istat VARCHAR(10),
        ADD COLUMN IF NOT EXISTS cap VARCHAR(5),
        ADD COLUMN IF NOT EXISTS prefisso_tel VARCHAR(5),
        ADD COLUMN IF NOT EXISTS sito_web VARCHAR(255),
        ADD COLUMN IF NOT EXISTS pec VARCHAR(255),
        ADD COLUMN IF NOT EXISTS altitudine_m INT,
        ADD COLUMN IF NOT EXISTS zona_sismica VARCHAR(10),
        ADD COLUMN IF NOT EXISTS zona_climatica VARCHAR(5),
        ADD COLUMN IF NOT EXISTS comuni_confinanti TEXT,
        ADD COLUMN IF NOT EXISTS hub_attivo TINYINT(1) DEFAULT 1,
        ADD COLUMN IF NOT EXISTS data_attivazione DATE,
        ADD COLUMN IF NOT EXISTS referente_comune VARCHAR(150),
        ADD COLUMN IF NOT EXISTS tel_referente VARCHAR(20)`,
        
      `CREATE TABLE IF NOT EXISTS convenzioni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        numero_atto VARCHAR(50),
        data_stipula DATE,
        data_scadenza DATE,
        stato VARCHAR(30) DEFAULT 'ATTIVA',
        oggetto TEXT,
        importo_annuo DECIMAL(10,2),
        documento_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notifiche (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        destinatario VARCHAR(150) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titolo VARCHAR(255) NOT NULL,
        messaggio TEXT,
        letta TINYINT(1) DEFAULT 0,
        ref_segnalazione VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS adozioni_t (
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
      )`,
      `CREATE TABLE IF NOT EXISTS calendari_intervento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        tipo_intervento VARCHAR(80) NOT NULL,
        operatore VARCHAR(100) NOT NULL,
        data_prevista DATETIME NOT NULL,
        data_effettiva DATETIME,
        ref_segnalazione VARCHAR(100),
        ref_microchip VARCHAR(50),
        esito VARCHAR(50),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS tariffario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        servizio_key VARCHAR(80) NOT NULL,
        descrizione VARCHAR(255),
        prezzo_unitario DECIMAL(10,2) NOT NULL,
        unita_misura VARCHAR(30) DEFAULT 'cadauno',
        iva_pct DECIMAL(5,2) DEFAULT 22.00,
        attivo TINYINT(1) DEFAULT 1,
        valido_dal DATE NOT NULL,
        valido_al DATE,
        UNIQUE KEY uq_tariffa (comune_key, servizio_key, valido_dal)
      )`,
      `CREATE TABLE IF NOT EXISTS costi_voci (
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
        ref_fattura_id INT,
        ref_intervento_id INT,
        ref_segnalazione VARCHAR(100),
        ref_microchip VARCHAR(50),
        data_voce DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS fatture (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comune_key VARCHAR(50) NOT NULL,
        numero_fattura VARCHAR(50) UNIQUE NOT NULL,
        data_emissione DATE NOT NULL,
        data_scadenza DATE,
        periodo_dal DATE,
        periodo_al DATE,
        imponibile DECIMAL(10,2) NOT NULL,
        totale_iva DECIMAL(10,2) NOT NULL,
        totale_fattura DECIMAL(10,2) NOT NULL,
        stato VARCHAR(30) DEFAULT 'EMESSA',
        data_pagamento DATE,
        metodo_pagamento VARCHAR(50),
        cig VARCHAR(20),
        cup VARCHAR(20),
        note TEXT,
        documento_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      "CREATE OR REPLACE VIEW v_crediti_per_comune AS SELECT f.comune_key, c.name AS nome_comune, COUNT(f.id) AS num_fatture_aperte, SUM(f.totale_fattura) AS totale_da_incassare, MIN(f.data_scadenza) AS prossima_scadenza, SUM(CASE WHEN f.data_scadenza < CURDATE() THEN f.totale_fattura ELSE 0 END) AS totale_scaduto FROM fatture f JOIN comuni c ON c.key_name = f.comune_key WHERE f.stato NOT IN ('PAGATA', 'ANNULLATA') GROUP BY f.comune_key, c.name",
      "CREATE OR REPLACE VIEW v_costi_per_servizio_anno AS SELECT cv.comune_key, cv.servizio_key, YEAR(cv.data_voce) AS anno, COUNT(*) AS num_prestazioni, SUM(cv.quantita) AS quantita_totale, SUM(cv.importo_netto) AS totale_netto, SUM(cv.importo_lordo) AS totale_lordo FROM costi_voci cv GROUP BY cv.comune_key, cv.servizio_key, YEAR(cv.data_voce)",
      `CREATE TABLE IF NOT EXISTS stats_snapshot_giornaliero (
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
      )`,
      "CREATE OR REPLACE VIEW v_kpi_dashboard AS SELECT c.key_name, c.name AS comune, COUNT(DISTINCT s.id) AS segnalazioni_totali, SUM(s.stato NOT IN ('RISOLTA','CHIUSA')) AS segnalazioni_attive, SUM(s.urgenza = 'CRITICA' AND s.stato NOT IN ('RISOLTA','CHIUSA')) AS segnalazioni_critiche, COUNT(DISTINCT ra.id) AS animali_in_gestione, SUM(ra.stato = 'ADOTTABILE') AS adottabili, COALESCE(SUM(st.capacita_max), 0) AS posti_totali, COALESCE(SUM(st.postazioni_occupate), 0) AS posti_occupati, COALESCE(ROUND( SUM(st.postazioni_occupate) / NULLIF(SUM(st.capacita_max),0) * 100, 1 ), 0) AS occupazione_pct, COALESCE(( SELECT SUM(f2.totale_fattura) FROM fatture f2 WHERE f2.comune_key = c.key_name AND f2.stato NOT IN ('PAGATA','ANNULLATA') ), 0) AS credito_aperto_euro FROM comuni c LEFT JOIN segnalazioni s ON s.comune_key = c.key_name LEFT JOIN registro_anagrafica ra ON ra.comune_key = c.key_name LEFT JOIN strutture st ON st.comune_key = c.key_name GROUP BY c.key_name, c.name",
      "CREATE OR REPLACE VIEW v_trend_segnalazioni_mensile AS SELECT comune_key, DATE_FORMAT(created_at, '%Y-%m') AS mese, COUNT(*) AS totale, SUM(stato = 'RISOLTA') AS risolte, SUM(urgenza IN ('ALTA','CRITICA')) AS urgenti, SUM(specie = 'CANE') AS cani, SUM(specie = 'GATTO') AS gatti FROM segnalazioni WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY comune_key, DATE_FORMAT(created_at, '%Y-%m') ORDER BY comune_key, mese",
      "CREATE OR REPLACE VIEW v_trend_fatturazione_mensile AS SELECT comune_key, DATE_FORMAT(data_emissione, '%Y-%m') AS mese, COUNT(*) AS num_fatture, SUM(totale_fattura) AS fatturato, SUM(CASE WHEN stato = 'PAGATA' THEN totale_fattura ELSE 0 END) AS incassato, SUM(CASE WHEN stato NOT IN ('PAGATA','ANNULLATA') THEN totale_fattura ELSE 0 END) AS credito_residuo FROM fatture WHERE data_emissione >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY comune_key, DATE_FORMAT(data_emissione, '%Y-%m') ORDER BY comune_key, mese",
      `CREATE PROCEDURE IF NOT EXISTS sp_genera_snapshot_oggi()
       BEGIN
       END`
    ];

    for (let q of queries) {
      try {
        console.log("Executing:", q.substring(0, 100) + "...");
        await pool.execute(q);
      } catch(e: any) {
        if (!e.message.includes('Duplicate column')) {
          console.error("Error executing query:", e.message);
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
