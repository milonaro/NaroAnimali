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
('sciacca', 'Sciacca', 37.5081, 13.0881, 11.0, 37.42, 37.58, 13.96, 13.20, 'I533', 191.01, '84', '402', 3.20, 'Santuario Felino e Canile Sanitario Sciacca Est. Sala operatoria per sterilizzazioni e primo soccorso animali randagi.')
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
ON DUPLICATE KEY UPDATE comune_key=VALUES(comune_key), nome=VALUES(nome), tipo=VALUES(tipo), indirizzo=VALUES(indirizzo), telefono=VALUES(telefono), capacita_max=VALUES(capacita_max), postazioni_occupate=VALUES(postazioni_occupate);
