-- =====================================================================
-- ANIMALHUB PA - INIZIALIZZAZIONE DATABASE UNIFICATO (MYSQL & FALLBACK SQLITE)
-- Questo script definisce lo schema relazionale completo e inserisce i records
-- di riferimento iniziale e demo per tutti i comuni convenzionati.
-- =====================================================================

-- 1. Tabella Comuni Convenzionati e Geofencing
CREATE TABLE IF NOT EXISTS comuni (
  key_name VARCHAR(50) PRIMARY KEY,
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
  dati_catastali_completi TEXT
);

-- 2. Tabella Configurazione Attiva e Preset
CREATE TABLE IF NOT EXISTS admin_config (
  key_name VARCHAR(100) PRIMARY KEY,
  value_data TEXT
);

-- 3. Tabella Ruoli Operatore nel portale
CREATE TABLE IF NOT EXISTS ruoli_operatore (
  ruolo_key VARCHAR(50) PRIMARY KEY,
  descrizione VARCHAR(255) NOT NULL
);

-- 4. Tabella Tipologie Animali gestite
CREATE TABLE IF NOT EXISTS tipologie_animali (
  specie_key VARCHAR(50) PRIMARY KEY,
  descrizione VARCHAR(255) NOT NULL
);

-- 5. Tabella Utenti & Operatori Profilati
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'OPERATORE',
  comune_key VARCHAR(50) DEFAULT 'naro'
);

-- 6. Tabella Centrale delle Segnalazioni
CREATE TABLE IF NOT EXISTS segnalazioni (
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
  stato VARCHAR(50) DEFAULT 'CREATA',
  urgenza VARCHAR(50) DEFAULT 'NORMALE',
  email_segnalante VARCHAR(150),
  nome_segnalante VARCHAR(100),
  consenso_privacy TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Tabella Registro Log Storico Interventi
CREATE TABLE IF NOT EXISTS interventi_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
  segnalazione_codice VARCHAR(100) NOT NULL,
  operatore VARCHAR(100) NOT NULL,
  azione VARCHAR(255) NOT NULL,
  note TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabella Registro Anagrafico Animali
CREATE TABLE IF NOT EXISTS registro_anagrafica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  microchip VARCHAR(50) UNIQUE NOT NULL,
  comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
  nome VARCHAR(100) NOT NULL,
  specie VARCHAR(50) NOT NULL,
  sesso VARCHAR(10) NOT NULL,
  taglia VARCHAR(50) NOT NULL,
  colore VARCHAR(100) NOT NULL,
  condizioni_sanitarie TEXT,
  stato VARCHAR(50) NOT NULL,
  foto_url TEXT,
  data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabella Strutture Convenzionate per Custodia e Soccorso
CREATE TABLE IF NOT EXISTS strutture (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comune_key VARCHAR(50) NOT NULL DEFAULT 'naro',
  nome VARCHAR(150) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  indirizzo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  capacita_max INT,
  postazioni_occupate INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- POPOLAMENTO PARAMETRI DI RIFERIMENTO & DATI DEMO PER ALL-COMUNI
-- =====================================================================

-- Popolamento Comuni Convenzionati di Riferimento ed Hub Attivati
INSERT INTO comuni (key_name, name, lat, lng, radius_km, lat_min, lat_max, lng_min, lng_max, codice_catastale, superficie_totale_km2, foglio_catastale_hub, particella_catastale_hub, estensione_ettari_hub, dati_catastali_completi) VALUES
('naro', 'Naro', 37.2957, 13.7936, 8.0, 37.25, 37.35, 13.74, 13.85, 'F845', 162.24, '72', '145', 1.85, 'Ente Urbano destinato a Centro di Soccorso e Servizi Sanitari Zootecnici. Connessione integrata con canile municipale di contrada Zaffuti. Esente IMU usi pubblici.'),
('agrigento', 'Agrigento', 37.3111, 13.5765, 12.0, 37.20, 37.40, 13.45, 13.70, 'A089', 245.43, '118', '239', 2.45, 'Hub di Soccorso Sanitario e Clinica della Valle dei Templi. Sezione Centralizzata Polizia Locale Agrigento.'),
('canicatti', 'Canicattì', 37.3591, 13.8496, 10.0, 37.30, 37.42, 13.75, 13.95, 'B602', 92.06, '45', '512', 1.20, 'Oasi Felina di Canicattì, rifugi sanitari convenzionati. Monitoraggio in convenzione ASP Agrigento.'),
('favara', 'Favara', 37.3151, 13.6628, 9.0, 37.26, 37.37, 13.60, 13.72, 'D514', 81.88, '31', '809', 0.95, 'Presidio Ambulatoriale e tutela benessere animale di Favara. Gestione microchip attiva.'),
('palermo', 'Palermo', 38.1157, 13.3614, 15.0, 38.00, 38.25, 13.20, 13.50, 'G273', 160.59, '92', '1004', 4.50, 'Rifugio Sanitario Canile Favorita di Palermo. Centro d\'eccellenza veterinaria accreditato.'),
('montallegro', 'Montallegro', 37.3915, 13.3512, 6.0, 37.35, 37.43, 13.28, 13.42, 'F514', 27.41, '12', '335', 0.78, 'Presidio ed Hub di Degenza Randagismo e Avifauna Torre Salsa. Sorveglianza convenzionata Ente Parco.'),
('portoempedocle', 'Porto Empedocle', 37.2911, 13.5283, 7.0, 37.25, 37.33, 13.47, 13.58, 'G914', 25.11, '8', '202', 1.10, 'Hub costiero Soccorso Animali Marina di Porto Empedocle. Supporto veterinario transitorio Guardia Costiera.'),
('sciacca', 'Sciacca', 37.5081, 13.0881, 11.0, 37.42, 37.58, 12.96, 13.20, 'I533', 191.01, '84', '402', 3.20, 'Santuario Felino e Canile Sanitario Sciacca Est. Sala operatoria per sterilizzazioni e primo soccorso animali randagi.')
ON DUPLICATE KEY UPDATE 
  name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng), radius_km=VALUES(radius_km),
  lat_min=VALUES(lat_min), lat_max=VALUES(lat_max), lng_min=VALUES(lng_min), lng_max=VALUES(lng_max),
  codice_catastale=VALUES(codice_catastale), superficie_totale_km2=VALUES(superficie_totale_km2),
  foglio_catastale_hub=VALUES(foglio_catastale_hub), particella_catastale_hub=VALUES(particella_catastale_hub),
  estensione_ettari_hub=VALUES(estensione_ettari_hub), dati_catastali_completi=VALUES(dati_catastali_completi);


-- Popolamento Configurazione Iniziale Preset attiva
INSERT INTO admin_config (key_name, value_data) VALUES
('siteName', 'Comune di Naro'),
('siteLogo', ''),
('activeComune', 'naro')
ON DUPLICATE KEY UPDATE value_data=value_data;


-- Popolamento Ruoli Operativi
INSERT INTO ruoli_operatore (ruolo_key, descrizione) VALUES
('ADMIN', 'Amministratore di Sistema / Gestore del Portale'),
('POLIZIA_LOCALE', 'Operatore Polizia Municipale Ente Locale'),
('CANILE_SANITARIO', 'Veterinario e Operatore Canile Convenzionato'),
('VOLONTARIO', 'Volontario Associazione Protezione Animali Autorizzata')
ON DUPLICATE KEY UPDATE descrizione=VALUES(descrizione);


-- Popolamento Tipologie Animali
INSERT INTO tipologie_animali (specie_key, descrizione) VALUES
('CANE', 'Cane / Canide domestico'),
('GATTO', 'Gatto / Felide domestico'),
('ALTRO', 'Specie diversa (es. Volatile, Equino, Ovino)')
ON DUPLICATE KEY UPDATE descrizione=VALUES(descrizione);


-- Popolamento Centrale delle Segnalazioni Demo (Tutti i preset in un'unica tabella)
INSERT INTO segnalazioni (id, comune_key, codice_tracking, specie, condizioni, descrizione, foto_url, latitudine, longitudine, indirizzo, stato, urgenza) VALUES
(1, 'naro', 'TRK-2026-N1', 'CANE', 'Randagio disorientato in piazza', 'Meticcio docile di taglia media, pelo castano focato. Sembra spaesato, cerca acqua vicino alla fontana civica.', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600', 37.2942, 13.7928, 'Piazza Garibaldi, Naro (AG)', 'CREATA', 'NORMALE'),
(2, 'naro', 'TRK-2026-N2', 'GATTO', 'Ferito alla zampa posteriore', 'Gattino europeo grigio pezzato bianco, zoppica visibilmente nel cortile interno del Castello di Naro.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600', 37.2915, 13.7915, 'Via Castello, Naro (AG)', 'IN_CARICO', 'ALTA'),
(3, 'agrigento', 'TRK-2026-A1', 'CANE', 'Pastore tedesco anziano disidratato', 'Pastore tedesco anziano e molto affaticato che staziona all''ombra di un gazebo sulla spiaggia di San Leone.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=600', 37.2662, 13.5898, 'Viale delle Dune, Agrigento (AG)', 'CREATA', 'ALTA'),
(4, 'agrigento', 'TRK-2026-A2', 'GATTO', 'Gattini con forte raffreddore', 'Tre gattini piccoli di circa 2 mesi con vistoso scolo oculare e nasale nei pressi dell''ingresso posteriore del teatro.', 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600', 37.3115, 13.5758, 'Via Atenea, Agrigento (AG)', 'IN_CARICO', 'NORMALE'),
(5, 'canicatti', 'TRK-2026-C1', 'CANE', 'Meticcio nero terrorizzato sui binari', 'Meticcio taglia media nero con petto bianco. Si aggira terrorizzato sulle banchine della stazione ferroviaria.', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=600', 37.3578, 13.8485, 'Piazza Stazione, Canicattì (AG)', 'CREATA', 'ALTA'),
(6, 'canicatti', 'TRK-2026-C2', 'GATTO', 'Gattino salvato, pronto al riscatto', 'Gattino bianco e grigio trovato sano in un contenitore, accudito in degenza temporanea.', 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&q=80&w=600', 37.3605, 13.8512, 'Viale della Vittoria, Canicattì (AG)', 'RISOLTA', 'ALTA'),
(7, 'favara', 'TRK-2026-F1', 'CANE', 'Cane investito ferito alla zampa', 'Cane meticcio marrone chiaro disteso sul marciapiede, guaisce per forte dolore.', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600', 37.3135, 13.6642, 'Viale Aldo Moro, Favara (AG)', 'CREATA', 'CRITICA'),
(8, 'favara', 'TRK-2026-F2', 'GATTO', 'Gatto bloccato su alto cornicione', 'Bellissimo gattino nero bloccato sopra il cornicione del secondo piano in piazza, immobile da stamattina.', 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600', 37.3168, 13.6611, 'Piazza Cavour, Favara (AG)', 'IN_CARICO', 'ALTA'),
(9, 'palermo', 'TRK-2026-P1', 'CANE', 'Cani vaganti ma amichevoli', 'Gruppo di 3 cani di grossa taglia stazionano mansueti nella zona verde, molto pacifici ma randagi.', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600', 38.1568, 13.3489, 'Parco della Favorita, Palermo (PA)', 'CREATA', 'NORMALE'),
(10, 'palermo', 'TRK-2026-P2', 'GATTO', 'Mamma gatta con 4 cuccioli', 'Mamma gatta randagia molto smagrita ha partorito 4 cuccioli in un sottoscala, necessita di stallo sanitario sicuro.', 'https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?auto=format&fit=crop&q=80&w=600', 38.1145, 13.3622, 'Via Roma, Palermo (PA)', 'IN_CARICO', 'ALTA')
ON DUPLICATE KEY UPDATE comune_key=VALUES(comune_key), codice_tracking=VALUES(codice_tracking), specie=VALUES(specie), condizioni=VALUES(condizioni), descrizione=VALUES(descrizione), foto_url=VALUES(foto_url), latitudine=VALUES(latitudine), longitudine=VALUES(longitudine), indirizzo=VALUES(indirizzo), stato=VALUES(stato), urgenza=VALUES(urgenza);


-- Popolamento Anagrafica Animali Demo (Tutti i preset in un'unica tabella)
INSERT INTO registro_anagrafica (id, microchip, comune_key, nome, specie, sesso, taglia, colore, condizioni_sanitarie, stato, foto_url) VALUES
(1, '380261000100001', 'naro', 'Stella', 'CANE', 'F', 'MEDIA', 'Nero e focato', 'Sana, vaccinata antirabbica e sterilizzata.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600'),
(2, '380261000100002', 'naro', 'Fufi', 'GATTO', 'M', 'PICCOLA', 'Soriano grigio', 'Trattato per acari delle orecchie, molto coccolone.', 'OSPITE', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600'),
(3, '380261000200001', 'agrigento', 'Argo', 'CANE', 'M', 'GRANDE', 'Miele fulvo', 'In splendida salute, allegro e reattivo.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600'),
(4, '380261000200002', 'agrigento', 'Micia', 'GATTO', 'F', 'PICCOLA', 'Tricolore calico', 'Sana, sterilizzata, adatta a bambini.', 'OSPITE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600'),
(5, '380261000300001', 'canicatti', 'Grimm', 'CANE', 'M', 'GRANDE', 'Fulvo scuro', 'Ex-randagio, sano e molto disciplinato.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=600'),
(6, '380261000300002', 'canicatti', 'Nebbia', 'GATTO', 'F', 'MEDIA', 'Bianco candido', 'Niente parassiti, sterilizzata ed estremamente quieta.', 'ADOTTATO', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=600'),
(7, '380261000400001', 'favara', 'Max', 'CANE', 'M', 'MEDIA', 'Bianco e nero', 'Sottoposto a sverminazione, molto socievole.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600'),
(8, '380261000400002', 'favara', 'Zelda', 'GATTO', 'F', 'PICCOLA', 'Nero pece', 'Ottima forma fisica, giocherellona.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600'),
(9, '380261000500001', 'palermo', 'Dante', 'CANE', 'M', 'GRANDE', 'Bianco maremmano', 'Controllato dal veterinario ASP, idoneo all''adozione.', 'OSPITE', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'),
(10, '380261000500002', 'palermo', 'Romeo', 'GATTO', 'M', 'MEDIA', 'Rosso tigrato', 'Trattato con antiparassitari, vacinato.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600')
ON DUPLICATE KEY UPDATE comune_key=VALUES(comune_key), nome=VALUES(nome), specie=VALUES(specie), sesso=VALUES(sesso), taglia=VALUES(taglia), colore=VALUES(colore), condizioni_sanitarie=VALUES(condizioni_sanitarie), stato=VALUES(stato), foto_url=VALUES(foto_url);


-- Popolamento Logs Intervento Demo (Tutti i preset in un'unica tabella)
INSERT INTO interventi_logs (id, comune_key, segnalazione_codice, operatore, azione, note) VALUES
(1, 'naro', 'TRK-2026-N2', 'veterinario', 'Sopralluogo ed esame clinico iniziale', 'Presa in consegna e avviato protocollo antidolorifico per trauma zampa.'),
(2, 'agrigento', 'TRK-2026-A2', 'polizia', 'Attivata l''ASP veterinaria di Agrigento', 'Fornito supporto logistico in loco per la salvaguardia dei gattini feriti.'),
(3, 'canicatti', 'TRK-2026-C2', 'canile', 'Tris di vaccinazioni e registrazione anagrafe', 'Gattino trattato con successo e successivamente adottato.'),
(4, 'favara', 'TRK-2026-F2', 'polizia', 'Invio squadra di soccorso', 'Gli operatori stanno posizionando le scale idonee per l''animale bloccato.'),
(5, 'palermo', 'TRK-2026-P2', 'veterinario', 'Ricovero neonatale ed esame ecografico', 'Madre e cuccioli trasferiti in stallo sanitario idoneo.')
ON DUPLICATE KEY UPDATE comune_key=VALUES(comune_key), segnalazione_codice=VALUES(segnalazione_codice), operatore=VALUES(operatore), azione=VALUES(azione), note=VALUES(note);


-- Popolamento Strutture Demo (Tutti i preset in un'unica tabella)
INSERT INTO strutture (id, comune_key, nome, tipo, indirizzo, telefono, capacita_max, postazioni_occupate) VALUES
(1, 'naro', 'Canile Comprensoriale Dogland', 'CANILE', 'Contrada Zaffuti, Naro (AG)', '0922 123456', 150, 120),
(2, 'naro', 'Oasi Felina La Coda', 'GATTILE', 'Via Agrigento, Naro (AG)', '0922 654321', 50, 30),
(3, 'agrigento', 'Rifugio San Leone', 'RIFUGIO', 'Viale dei Pini, Agrigento (AG)', '0922 991122', 100, 85),
(4, 'canicatti', 'Oasi Felina Canicattì', 'GATTILE', 'Via Vittorio Veneto, Canicattì (AG)', '0922 774411', 80, 45),
(5, 'favara', 'Clinica Veterinaria Favara Vet', 'CLINICA_VET', 'Viale S. Angelo, Favara (AG)', '0922 885522', 20, 12),
(6, 'palermo', 'Rifugio Municipale Palermo', 'CANILE', 'Parco della Favorita, Palermo (PA)', '091 668822', 300, 245)
-- =====================================================================
-- ANIMALHUB PA — AGGIORNAMENTI E PROPOSTE DI SCHEMA
-- =====================================================================

UPDATE comuni SET superficie_totale_km2 = 207.49 WHERE key_name = 'naro';
UPDATE comuni SET superficie_totale_km2 = 244.57 WHERE key_name = 'agrigento';
UPDATE comuni SET superficie_totale_km2 = 91.40 WHERE key_name = 'canicatti';
UPDATE comuni SET superficie_totale_km2 = 25.23 WHERE key_name = 'portoempedocle';

ALTER TABLE comuni
  -- Dati anagrafici base
  ADD COLUMN codice_istat       VARCHAR(10)    COMMENT 'Codice ISTAT comune (es. 084026 per Naro)',
  ADD COLUMN cap                VARCHAR(5)     COMMENT 'Codice di Avviamento Postale',
  ADD COLUMN prefisso_tel       VARCHAR(5)     COMMENT 'Prefisso telefonico (es. 0922)',
  ADD COLUMN sito_web           VARCHAR(255)   COMMENT 'URL sito istituzionale del comune',
  ADD COLUMN pec                VARCHAR(255)   COMMENT 'Indirizzo PEC del comune',

  -- Dati geografici aggiuntivi
  ADD COLUMN altitudine_m       INT            COMMENT 'Altitudine sede municipio in metri s.l.m.',
  ADD COLUMN zona_sismica       VARCHAR(10)    COMMENT 'Zona sismica INGV (es. Zona 2, Zona 3)',
  ADD COLUMN zona_climatica     VARCHAR(5)     COMMENT 'Zona climatica (A–F)',
  ADD COLUMN comuni_confinanti  TEXT           COMMENT 'Lista comuni confinanti separata da virgola',

  -- Stato operativo hub AnimalHub
  ADD COLUMN hub_attivo         TINYINT(1)     DEFAULT 1  COMMENT '1 = hub attivo, 0 = sospeso',
  ADD COLUMN data_attivazione   DATE           COMMENT 'Data di attivazione convenzione AnimalHub',
  ADD COLUMN referente_comune   VARCHAR(150)   COMMENT 'Nome referente comunale per il servizio',
  ADD COLUMN tel_referente      VARCHAR(20)    COMMENT 'Telefono referente comunale';


-- =====================================================================
-- PARTE 3 — TABELLA NUOVA: convenzioni
-- =====================================================================
CREATE TABLE IF NOT EXISTS convenzioni (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  comune_key        VARCHAR(50) NOT NULL,
  numero_atto       VARCHAR(50)   COMMENT 'Numero delibera/determina di approvazione',
  data_stipula      DATE          NOT NULL,
  data_scadenza     DATE,
  stato             VARCHAR(30)   DEFAULT 'ATTIVA' COMMENT 'ATTIVA | SCADUTA | RINNOVATA | REVOCATA',
  oggetto           TEXT          COMMENT 'Descrizione oggetto della convenzione',
  importo_annuo     DECIMAL(10,2) COMMENT 'Eventuale corrispettivo annuo in euro',
  documento_url     TEXT          COMMENT 'URL o path documento convenzione',
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- PARTE 4 — TABELLA NUOVA: notifiche
-- =====================================================================
CREATE TABLE IF NOT EXISTS notifiche (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  comune_key      VARCHAR(50)  NOT NULL,
  destinatario    VARCHAR(150) NOT NULL COMMENT 'Email o username destinatario',
  tipo            VARCHAR(50)  NOT NULL COMMENT 'NUOVA_SEGNALAZIONE | STATO_AGGIORNATO | ADOZIONE | SISTEMA',
  titolo          VARCHAR(255) NOT NULL,
  messaggio       TEXT,
  letta           TINYINT(1)   DEFAULT 0,
  ref_segnalazione VARCHAR(100) COMMENT 'codice_tracking segnalazione correlata (opzionale)',
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- PARTE 5 — TABELLA NUOVA: adozioni
-- =====================================================================
CREATE TABLE IF NOT EXISTS adozioni (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  microchip           VARCHAR(50)  NOT NULL COMMENT 'FK verso registro_anagrafica',
  comune_key          VARCHAR(50)  NOT NULL,
  nome_adottante      VARCHAR(150) NOT NULL,
  cognome_adottante   VARCHAR(150) NOT NULL,
  cf_adottante        VARCHAR(16)  COMMENT 'Codice fiscale adottante',
  telefono_adottante  VARCHAR(20),
  email_adottante     VARCHAR(150),
  indirizzo_adottante VARCHAR(255),
  data_richiesta      DATE         NOT NULL,
  data_approvazione   DATE,
  data_consegna       DATE,
  stato               VARCHAR(30)  DEFAULT 'IN_VALUTAZIONE' COMMENT 'IN_VALUTAZIONE | APPROVATA | NEGATA | COMPLETATA | REVOCATA',
  note_operatore      TEXT,
  documento_url       TEXT         COMMENT 'Modulo adozione firmato',
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================================
-- PARTE 6 — TABELLA NUOVA: calendari_intervento
-- =====================================================================
CREATE TABLE IF NOT EXISTS calendari_intervento (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  comune_key      VARCHAR(50)  NOT NULL,
  tipo_intervento VARCHAR(80)  NOT NULL COMMENT 'STERILIZZAZIONE | CATTURA | SOPRALLUOGO | TRASPORTO | VACCINAZIONE',
  operatore       VARCHAR(100) NOT NULL,
  data_prevista   DATETIME     NOT NULL,
  data_effettiva  DATETIME,
  ref_segnalazione VARCHAR(100) COMMENT 'Eventuale segnalazione collegata',
  ref_microchip   VARCHAR(50)  COMMENT 'Eventuale animale coinvolto',
  esito           VARCHAR(50)  COMMENT 'COMPLETATO | ANNULLATO | RINVIATO',
  note            TEXT,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- PARTE 7 — COSTI E FATTURAZIONE PER COMUNE
-- =====================================================================
CREATE TABLE IF NOT EXISTS tariffario (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  comune_key      VARCHAR(50)   NOT NULL,
  servizio_key    VARCHAR(80)   NOT NULL  COMMENT 'Es: CATTURA | RICOVERO_GIORNO | STERILIZZAZIONE | VACCINAZIONE | MICROCHIP | TRASPORTO | EUTANASIA',
  descrizione     VARCHAR(255),
  prezzo_unitario DECIMAL(10,2) NOT NULL  COMMENT 'Prezzo in euro IVA esclusa',
  unita_misura    VARCHAR(30)   DEFAULT 'cadauno' COMMENT 'cadauno | giorno | km | ora',
  iva_pct         DECIMAL(5,2)  DEFAULT 22.00,
  attivo          TINYINT(1)    DEFAULT 1,
  valido_dal      DATE          NOT NULL,
  valido_al       DATE,
  UNIQUE KEY uq_tariffa (comune_key, servizio_key, valido_dal)
);

CREATE TABLE IF NOT EXISTS costi_voci (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  comune_key          VARCHAR(50)   NOT NULL,
  servizio_key        VARCHAR(80)   NOT NULL,
  descrizione         VARCHAR(255),
  quantita            DECIMAL(10,3) DEFAULT 1.000,
  prezzo_unitario     DECIMAL(10,2) NOT NULL,
  importo_netto       DECIMAL(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario) STORED,
  iva_pct             DECIMAL(5,2)  DEFAULT 22.00,
  importo_iva         DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantita * prezzo_unitario * iva_pct / 100, 2)) STORED,
  importo_lordo       DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantita * prezzo_unitario * (1 + iva_pct / 100), 2)) STORED,
  ref_fattura_id      INT           COMMENT 'FK verso fatture.id, NULL finché non fatturato',
  ref_intervento_id   INT           COMMENT 'FK verso calendari_intervento.id (opzionale)',
  ref_segnalazione    VARCHAR(100)  COMMENT 'codice_tracking segnalazione (opzionale)',
  ref_microchip       VARCHAR(50)   COMMENT 'Microchip animale coinvolto (opzionale)',
  data_voce           DATE          NOT NULL,
  note                TEXT,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fatture (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  comune_key          VARCHAR(50)   NOT NULL,
  numero_fattura      VARCHAR(50)   UNIQUE NOT NULL COMMENT 'Es: 2026/001/NAR',
  data_emissione      DATE          NOT NULL,
  data_scadenza       DATE,
  periodo_dal         DATE          COMMENT 'Periodo di competenza inizio',
  periodo_al          DATE          COMMENT 'Periodo di competenza fine',
  imponibile          DECIMAL(10,2) NOT NULL,
  totale_iva          DECIMAL(10,2) NOT NULL,
  totale_fattura      DECIMAL(10,2) NOT NULL,
  stato               VARCHAR(30)   DEFAULT 'EMESSA' COMMENT 'EMESSA | INVIATA | PAGATA | SCADUTA | ANNULLATA',
  data_pagamento      DATE,
  metodo_pagamento    VARCHAR(50)   COMMENT 'BONIFICO | F24 | ALTRO',
  cig                 VARCHAR(20)   COMMENT 'Codice Identificativo Gara (appalti PA)',
  cup                 VARCHAR(20)   COMMENT 'Codice Unico Progetto (se applicabile)',
  note                TEXT,
  documento_url       TEXT          COMMENT 'Path/URL XML fattura elettronica PA',
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW v_crediti_per_comune AS
SELECT
  f.comune_key,
  c.name                                          AS nome_comune,
  COUNT(f.id)                                     AS num_fatture_aperte,
  SUM(f.totale_fattura)                           AS totale_da_incassare,
  MIN(f.data_scadenza)                            AS prossima_scadenza,
  SUM(CASE WHEN f.data_scadenza < CURDATE()
           THEN f.totale_fattura ELSE 0 END)      AS totale_scaduto
FROM fatture f
JOIN comuni c ON c.key_name = f.comune_key
WHERE f.stato NOT IN ('PAGATA', 'ANNULLATA')
GROUP BY f.comune_key, c.name;

CREATE OR REPLACE VIEW v_costi_per_servizio_anno AS
SELECT
  cv.comune_key,
  cv.servizio_key,
  YEAR(cv.data_voce)                              AS anno,
  COUNT(*)                                        AS num_prestazioni,
  SUM(cv.quantita)                                AS quantita_totale,
  SUM(cv.importo_netto)                           AS totale_netto,
  SUM(cv.importo_lordo)                           AS totale_lordo
FROM costi_voci cv
GROUP BY cv.comune_key, cv.servizio_key, YEAR(cv.data_voce);

CREATE TABLE IF NOT EXISTS stats_snapshot_giornaliero (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  comune_key                VARCHAR(50) NOT NULL,
  data_snapshot             DATE        NOT NULL,
  segnalazioni_totali       INT DEFAULT 0,
  segnalazioni_aperte       INT DEFAULT 0,
  segnalazioni_in_carico    INT DEFAULT 0,
  segnalazioni_risolte      INT DEFAULT 0,
  segnalazioni_urgenti      INT DEFAULT 0  COMMENT 'ALTA + CRITICA',
  animali_totali            INT DEFAULT 0,
  animali_adottabili        INT DEFAULT 0,
  animali_ospiti            INT DEFAULT 0,
  animali_adottati          INT DEFAULT 0 COMMENT 'Storico cumulativo adozioni',
  animali_cani              INT DEFAULT 0,
  animali_gatti             INT DEFAULT 0,
  animali_altri             INT DEFAULT 0,
  posti_totali              INT DEFAULT 0,
  posti_occupati            INT DEFAULT 0,
  tasso_occupazione_pct     DECIMAL(5,2) DEFAULT 0.00,
  interventi_pianificati    INT DEFAULT 0,
  interventi_completati     INT DEFAULT 0,
  sterilizzazioni_mese      INT DEFAULT 0,
  vaccinazioni_mese         INT DEFAULT 0,
  fatturato_mese_corrente   DECIMAL(10,2) DEFAULT 0.00,
  incassato_mese_corrente   DECIMAL(10,2) DEFAULT 0.00,
  credito_aperto            DECIMAL(10,2) DEFAULT 0.00,
  created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_snap (comune_key, data_snapshot)
);

CREATE OR REPLACE VIEW v_kpi_dashboard AS
SELECT
  c.key_name,
  c.name                                                      AS comune,
  COUNT(DISTINCT s.id)                                        AS segnalazioni_totali,
  SUM(s.stato NOT IN ('RISOLTA','CHIUSA'))                    AS segnalazioni_attive,
  SUM(s.urgenza = 'CRITICA' AND s.stato NOT IN ('RISOLTA','CHIUSA')) AS segnalazioni_critiche,
  COUNT(DISTINCT ra.id)                                       AS animali_in_gestione,
  SUM(ra.stato = 'ADOTTABILE')                                AS adottabili,
  COALESCE(SUM(st.capacita_max), 0)                           AS posti_totali,
  COALESCE(SUM(st.postazioni_occupate), 0)                    AS posti_occupati,
  COALESCE(ROUND(
    SUM(st.postazioni_occupate) / NULLIF(SUM(st.capacita_max),0) * 100, 1
  ), 0)                                                       AS occupazione_pct,
  COALESCE((
    SELECT SUM(f2.totale_fattura)
    FROM fatture f2
    WHERE f2.comune_key = c.key_name
      AND f2.stato NOT IN ('PAGATA','ANNULLATA')
  ), 0)                                                       AS credito_aperto_euro
FROM comuni c
LEFT JOIN segnalazioni        s  ON s.comune_key  = c.key_name
LEFT JOIN registro_anagrafica ra ON ra.comune_key = c.key_name
LEFT JOIN strutture           st ON st.comune_key = c.key_name
GROUP BY c.key_name, c.name;

CREATE OR REPLACE VIEW v_trend_segnalazioni_mensile AS
SELECT
  comune_key,
  DATE_FORMAT(created_at, '%Y-%m')    AS mese,
  COUNT(*)                            AS totale,
  SUM(stato = 'RISOLTA')              AS risolte,
  SUM(urgenza IN ('ALTA','CRITICA'))  AS urgenti,
  SUM(specie = 'CANE')                AS cani,
  SUM(specie = 'GATTO')               AS gatti
FROM segnalazioni
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY comune_key, DATE_FORMAT(created_at, '%Y-%m')
ORDER BY comune_key, mese;

CREATE OR REPLACE VIEW v_trend_fatturazione_mensile AS
SELECT
  comune_key,
  DATE_FORMAT(data_emissione, '%Y-%m')  AS mese,
  COUNT(*)                              AS num_fatture,
  SUM(totale_fattura)                   AS fatturato,
  SUM(CASE WHEN stato = 'PAGATA'
           THEN totale_fattura ELSE 0 END) AS incassato,
  SUM(CASE WHEN stato NOT IN ('PAGATA','ANNULLATA')
           THEN totale_fattura ELSE 0 END) AS credito_residuo
FROM fatture
WHERE data_emissione >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY comune_key, DATE_FORMAT(data_emissione, '%Y-%m')
ORDER BY comune_key, mese;

-- =====================================================================
-- PARTE 8 — LOGS DI ACCESSO E TRACCIAMENTO
-- =====================================================================

CREATE TABLE IF NOT EXISTS admin_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    comune_key VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accesso_riuscito TINYINT(1) DEFAULT 1,
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citizen_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150),
    codice_fiscale VARCHAR(16),
    ip_address VARCHAR(45),
    user_agent TEXT,
    azione VARCHAR(100) DEFAULT 'LOGIN_OTP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_tracking_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_visited VARCHAR(255),
    referrer VARCHAR(255),
    comune_selezionato VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
