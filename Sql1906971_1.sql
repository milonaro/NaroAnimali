-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 31.11.38.16:3306
-- Creato il: Giu 11, 2026 alle 14:22
-- Versione del server: 8.0.44-35
-- Versione PHP: 8.0.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `Sql1906971_1`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `admin_access_logs`
--

CREATE TABLE `admin_access_logs` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `comune_key` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `accesso_riuscito` tinyint(1) DEFAULT '1',
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `admin_config`
--

CREATE TABLE `admin_config` (
  `key_name` varchar(100) NOT NULL,
  `value_data` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `admin_config`
--

INSERT INTO `admin_config` (`key_name`, `value_data`) VALUES
('activeComune', 'naro'),
('siteLogo', ''),
('siteName', 'Comune di Naro');

-- --------------------------------------------------------

--
-- Struttura della tabella `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'OPERATORE',
  `comune_key` varchar(50) DEFAULT 'naro',
  `visible_modules` text,
  `email` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `role`, `comune_key`, `visible_modules`, `email`) VALUES
(1, 'admin', '$2b$10$uM4owob1PGtPenH9eDt0JedPM3ZdV2Gsw.99nXV4lo.7D66W.KFOi', 'ADMIN', 'naro', '[\"statistiche\",\"modulo-b\",\"modulo-c\",\"modulo-adozioni\"]', 'admin@animalhub.it'),
(2, 'polizia', '$2b$10$N9MXe3zBUprSO0wjIYS0l.FosZS0RvABVcHlntWWPBf9iCEzBP4Oa', 'POLIZIA_LOCALE', 'naro', '[\"modulo-b\",\"modulo-c\"]', 'polizia@animalhub.it'),
(3, 'canile', '$2b$10$IAfZobbmL6AZQnRbwSXjAeG2a4HS8Oq/qPOzGoNLNK4a4DNsIuo62', 'CANILE_SANITARIO', 'naro', '[\"modulo-b\",\"modulo-c\",\"modulo-adozioni\"]', 'canile@animalhub.it'),
(4, 'volontario', '$2b$10$V/3H/5WuLdfqFuWEgO23lexKvWZvCic71h51WuFUugQCnOszNlWU.', 'VOLONTARIO', 'naro', '[\"modulo-b\"]', 'volontari@animalhub.it');

-- --------------------------------------------------------

--
-- Struttura della tabella `citizen_access_logs`
--

CREATE TABLE `citizen_access_logs` (
  `id` int NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `codice_fiscale` varchar(16) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `azione` varchar(100) DEFAULT 'LOGIN_OTP',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `comuni`
--

CREATE TABLE `comuni` (
  `key_name` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `radius_km` decimal(5,2) NOT NULL,
  `lat_min` decimal(10,8) NOT NULL,
  `lat_max` decimal(10,8) NOT NULL,
  `lng_min` decimal(11,8) NOT NULL,
  `lng_max` decimal(11,8) NOT NULL,
  `codice_catastale` varchar(10) DEFAULT NULL,
  `superficie_totale_km2` decimal(10,2) DEFAULT NULL,
  `foglio_catastale_hub` varchar(50) DEFAULT NULL,
  `particella_catastale_hub` varchar(50) DEFAULT NULL,
  `estensione_ettari_hub` decimal(10,4) DEFAULT NULL,
  `dati_catastali_completi` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `comuni`
--

INSERT INTO `comuni` (`key_name`, `name`, `lat`, `lng`, `radius_km`, `lat_min`, `lat_max`, `lng_min`, `lng_max`, `codice_catastale`, `superficie_totale_km2`, `foglio_catastale_hub`, `particella_catastale_hub`, `estensione_ettari_hub`, `dati_catastali_completi`) VALUES
('agrigento', 'Agrigento', 37.31110000, 13.57650000, 12.00, 37.20000000, 37.40000000, 13.45000000, 13.70000000, 'A089', 244.57, '118', '239', 2.4500, 'Hub di Soccorso Sanitario e Clinica della Valle dei Templi. Sezione Centralizzata Polizia Locale Agrigento.'),
('canicatti', 'Canicattì', 37.35910000, 13.84960000, 10.00, 37.30000000, 37.42000000, 13.75000000, 13.95000000, 'B602', 91.40, '45', '512', 1.2000, 'Oasi Felina di Canicattì, rifugi sanitari convenzionati. Monitoraggio in convenzione ASP Agrigento.'),
('favara', 'Favara', 37.31510000, 13.66280000, 9.00, 37.26000000, 37.37000000, 13.60000000, 13.72000000, 'D514', 81.88, '31', '809', 0.9500, 'Presidio Ambulatoriale e tutela benessere animale di Favara. Gestione microchip attiva.'),
('montallegro', 'Montallegro', 37.39150000, 13.35120000, 6.00, 37.35000000, 37.43000000, 13.28000000, 13.42000000, 'F514', 27.41, '12', '335', 0.7800, 'Presidio ed Hub di Degenza Randagismo e Avifauna Torre Salsa. Sorveglianza convenzionata Ente Parco.'),
('naro', 'Naro', 37.29570000, 13.79360000, 8.00, 37.25000000, 37.35000000, 13.74000000, 13.85000000, 'F845', 207.49, '74', '145', 1.8500, 'Ente Urbano destinato a Centro di Soccorso e Servizi Sanitari Zootecnici. Connessione integrata con canile municipale di contrada Zaffuti. Esente IMU usi pubblici.'),
('palermo', 'Palermo', 38.11570000, 13.36140000, 15.00, 38.00000000, 38.25000000, 13.20000000, 13.50000000, 'G273', 160.59, '92', '1004', 4.5000, 'Rifugio Sanitario Canile Favorita di Palermo. Centro d\'eccellenza veterinaria accreditato.'),
('portoempedocle', 'Porto Empedocle', 37.29110000, 13.52830000, 7.00, 37.25000000, 37.33000000, 13.47000000, 13.58000000, 'G914', 25.23, '8', '202', 1.1000, 'Hub costiero Soccorso Animali Marina di Porto Empedocle. Supporto veterinario transitorio Guardia Costiera.'),
('sciacca', 'Sciacca', 37.50810000, 13.08810000, 11.00, 37.42000000, 37.58000000, 13.96000000, 13.20000000, 'I533', 191.01, '84', '402', 3.2000, 'Santuario Felino e Canile Sanitario Sciacca Est. Sala operatoria per sterilizzazioni e primo soccorso animali randagi.');

-- --------------------------------------------------------

--
-- Struttura della tabella `interventi_logs`
--

CREATE TABLE `interventi_logs` (
  `id` int NOT NULL,
  `comune_key` varchar(50) NOT NULL DEFAULT 'naro',
  `segnalazione_codice` varchar(100) NOT NULL,
  `operatore` varchar(100) NOT NULL,
  `azione` varchar(255) NOT NULL,
  `note` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `interventi_logs`
--

INSERT INTO `interventi_logs` (`id`, `comune_key`, `segnalazione_codice`, `operatore`, `azione`, `note`, `timestamp`) VALUES
(1, 'naro', 'TRK-2026-N2', 'veterinario', 'Sopralluogo ed esame clinico iniziale', 'Presa in consegna e avviato protocollo antidolorifico per trauma zampa.', '2026-06-08 19:46:54'),
(2, 'agrigento', 'TRK-2026-A2', 'polizia', 'Attivata l\'ASP veterinaria di Agrigento', 'Fornito supporto logistico in loco per la salvaguardia dei gattini feriti.', '2026-06-08 19:46:54'),
(3, 'canicatti', 'TRK-2026-C2', 'canile', 'Tris di vaccinazioni e registrazione anagrafe', 'Gattino trattato con successo e successivamente adottato.', '2026-06-08 19:46:54'),
(4, 'favara', 'TRK-2026-F2', 'polizia', 'Invio squadra di soccorso', 'Gli operatori stanno posizionando le scale idonee per l\'animale bloccato.', '2026-06-08 19:46:54'),
(5, 'palermo', 'TRK-2026-P2', 'veterinario', 'Ricovero neonatale ed esame ecografico', 'Madre e cuccioli trasferiti in stallo sanitario idoneo.', '2026-06-08 19:46:54');

-- --------------------------------------------------------

--
-- Struttura della tabella `registro_anagrafica`
--

CREATE TABLE `registro_anagrafica` (
  `id` int NOT NULL,
  `microchip` varchar(50) NOT NULL,
  `comune_key` varchar(50) NOT NULL DEFAULT 'naro',
  `nome` varchar(100) NOT NULL,
  `specie` varchar(50) NOT NULL,
  `sesso` varchar(10) NOT NULL,
  `taglia` varchar(50) NOT NULL,
  `colore` varchar(100) NOT NULL,
  `condizioni_sanitarie` text,
  `stato` varchar(50) NOT NULL,
  `foto_url` text,
  `data_registrazione` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `registro_anagrafica`
--

INSERT INTO `registro_anagrafica` (`id`, `microchip`, `comune_key`, `nome`, `specie`, `sesso`, `taglia`, `colore`, `condizioni_sanitarie`, `stato`, `foto_url`, `data_registrazione`) VALUES
(1, '380261000100001', 'naro', 'Stella', 'CANE', 'F', 'MEDIA', 'Nero e focato', 'Sana, vaccinata antirabbica e sterilizzata.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(2, '380261000100002', 'naro', 'Fufi', 'GATTO', 'M', 'PICCOLA', 'Soriano grigio', 'Trattato per acari delle orecchie, molto coccolone.', 'OSPITE', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(3, '380261000200001', 'naro', 'Argo', 'CANE', 'M', 'GRANDE', 'Miele fulvo', 'In splendida salute, allegro e reattivo.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(4, '380261000200002', 'naro', 'Micia', 'GATTO', 'F', 'PICCOLA', 'Tricolore calico', 'Sana, sterilizzata, adatta a bambini.', 'OSPITE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(5, '380261000300001', 'naro', 'Grimm', 'CANE', 'M', 'GRANDE', 'Fulvo scuro', 'Ex-randagio, sano e molto disciplinato.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(6, '380261000300002', 'naro', 'Nebbia', 'GATTO', 'F', 'MEDIA', 'Bianco candido', 'Niente parassiti, sterilizzata ed estremamente quieta.', 'ADOTTATO', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(7, '380261000400001', 'naro', 'Max', 'CANE', 'M', 'MEDIA', 'Bianco e nero', 'Sottoposto a sverminazione, molto socievole.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(8, '380261000400002', 'naro', 'Zelda', 'GATTO', 'F', 'PICCOLA', 'Nero pece', 'Ottima forma fisica, giocherellona.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(9, '380261000500001', 'naro', 'Dante', 'CANE', 'M', 'GRANDE', 'Bianco maremmano', 'Controllato dal veterinario ASP, idoneo all\'adozione.', 'OSPITE', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54'),
(10, '380261000500002', 'naro', 'Romeo', 'GATTO', 'M', 'MEDIA', 'Rosso tigrato', 'Trattato con antiparassitari, vacinato.', 'ADOTTABILE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600', '2026-06-08 19:46:54');

-- --------------------------------------------------------

--
-- Struttura della tabella `ruoli_operatore`
--

CREATE TABLE `ruoli_operatore` (
  `ruolo_key` varchar(50) NOT NULL,
  `descrizione` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `ruoli_operatore`
--

INSERT INTO `ruoli_operatore` (`ruolo_key`, `descrizione`) VALUES
('ADMIN', 'Amministratore di Sistema / Gestore del Portale'),
('CANILE_SANITARIO', 'Veterinario e Operatore Canile Convenzionato'),
('POLIZIA_LOCALE', 'Operatore Polizia Municipale Ente Locale'),
('VOLONTARIO', 'Volontario Associazione Protezione Animali Autorizzata');

-- --------------------------------------------------------

--
-- Struttura della tabella `segnalazioni`
--

CREATE TABLE `segnalazioni` (
  `id` int NOT NULL,
  `comune_key` varchar(50) NOT NULL DEFAULT 'naro',
  `codice_tracking` varchar(100) NOT NULL,
  `specie` varchar(50) NOT NULL,
  `condizioni` varchar(255) DEFAULT NULL,
  `descrizione` text,
  `foto_url` text,
  `latitudine` decimal(10,8) NOT NULL,
  `longitudine` decimal(11,8) NOT NULL,
  `indirizzo` varchar(255) DEFAULT NULL,
  `stato` varchar(50) DEFAULT 'CREATA',
  `urgenza` varchar(50) DEFAULT 'NORMALE',
  `email_segnalante` varchar(150) DEFAULT NULL,
  `nome_segnalante` varchar(100) DEFAULT NULL,
  `consenso_privacy` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `segnalazioni`
--

INSERT INTO `segnalazioni` (`id`, `comune_key`, `codice_tracking`, `specie`, `condizioni`, `descrizione`, `foto_url`, `latitudine`, `longitudine`, `indirizzo`, `stato`, `urgenza`, `email_segnalante`, `nome_segnalante`, `consenso_privacy`, `created_at`, `updated_at`) VALUES
(1, 'naro', 'TRK-2026-N1', 'CANE', 'Randagio disorientato in piazza', 'Meticcio docile di taglia media, pelo castano focato. Sembra spaesato, cerca acqua vicino alla fontana civica.', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600', 37.29420000, 13.79280000, 'Piazza Garibaldi, Naro (AG)', 'CREATA', 'NORMALE', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-08 19:46:54'),
(2, 'naro', 'TRK-2026-N2', 'GATTO', 'Ferito alla zampa posteriore', 'Gattino europeo grigio pezzato bianco, zoppica visibilmente nel cortile interno del Castello di Naro.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600', 37.29150000, 13.79150000, 'Via Castello, Naro (AG)', 'IN_CARICO', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-08 19:46:54'),
(3, 'naro', 'TRK-2026-A1', 'CANE', 'Pastore tedesco anziano disidratato', 'Pastore tedesco anziano e molto affaticato che staziona all\'ombra di un gazebo sulla spiaggia di San Leone.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=600', 37.26620000, 13.58980000, 'Viale delle Dune, Naro (AG)', 'CREATA', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:07'),
(4, 'naro', 'TRK-2026-A2', 'GATTO', 'Gattini con forte raffreddore', 'Tre gattini piccoli di circa 2 mesi con vistoso scolo oculare e nasale nei pressi dell\'ingresso posteriore del teatro.', 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600', 37.31150000, 13.57580000, 'Via naro, Agrigento (AG)', 'IN_CARICO', 'NORMALE', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:10'),
(5, 'naro', 'TRK-2026-C1', 'CANE', 'Meticcio nero terrorizzato sui binari', 'Meticcio taglia media nero con petto bianco. Si aggira terrorizzato sulle banchine della stazione ferroviaria.', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=600', 37.35780000, 13.84850000, 'Piazza Naro , Canicattì (AG)', 'CREATA', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:11'),
(6, 'naro', 'TRK-2026-C2', 'GATTO', 'Gattino salvato, pronto al riscatto', 'Gattino bianco e grigio trovato sano in un contenitore, accudito in degenza temporanea.', 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&q=80&w=600', 37.36050000, 13.85120000, 'Viale della Vittoria, Naro (AG)', 'RISOLTA', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:13'),
(7, 'naro', 'TRK-2026-F1', 'CANE', 'Cane investito ferito alla zampa', 'Cane meticcio marrone chiaro disteso sul marciapiede, guaisce per forte dolore.', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600', 37.31350000, 13.66420000, 'Viale Aldo Moro, Naro (AG)', 'CREATA', 'CRITICA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:15'),
(8, 'naro', 'TRK-2026-F2', 'GATTO', 'Gatto bloccato su alto cornicione', 'Bellissimo gattino nero bloccato sopra il cornicione del secondo piano in piazza, immobile da stamattina.', 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&q=80&w=600', 37.31680000, 13.66110000, 'Piazza Cavour, Naro (AG)', 'IN_CARICO', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:17'),
(9, 'naro', 'TRK-2026-P1', 'CANE', 'Cani vaganti ma amichevoli', 'Gruppo di 3 cani di grossa taglia stazionano mansueti nella zona verde, molto pacifici ma randagi.', 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600', 38.15680000, 13.34890000, 'Parco della Favorita, Naro (AG)', 'CREATA', 'NORMALE', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:53'),
(10, 'naro', 'TRK-2026-P2', 'GATTO', 'Mamma gatta con 4 cuccioli', 'Mamma gatta randagia molto smagrita ha partorito 4 cuccioli in un sottoscala, necessita di stallo sanitario sicuro.', 'https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?auto=format&fit=crop&q=80&w=600', 38.11450000, 13.36220000, 'Via Roma, Naro (AG)', 'IN_CARICO', 'ALTA', NULL, NULL, 0, '2026-06-08 19:46:54', '2026-06-10 15:37:56');

-- --------------------------------------------------------

--
-- Struttura della tabella `strutture`
--

CREATE TABLE `strutture` (
  `id` int NOT NULL,
  `comune_key` varchar(50) NOT NULL DEFAULT 'naro',
  `nome` varchar(150) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `indirizzo` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `capacita_max` int DEFAULT NULL,
  `postazioni_occupate` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `strutture`
--

INSERT INTO `strutture` (`id`, `comune_key`, `nome`, `tipo`, `indirizzo`, `telefono`, `capacita_max`, `postazioni_occupate`, `created_at`) VALUES
(1, 'naro', 'Canile Comprensoriale Dogland', 'CANILE', 'Contrada Zaffuti, Naro (AG)', '0922 123456', 150, 120, '2026-06-08 19:46:54'),
(2, 'naro', 'Oasi Felina La Coda', 'GATTILE', 'Via Agrigento, Naro (AG)', '0922 654321', 50, 30, '2026-06-08 19:46:54'),
(3, 'agrigento', 'Rifugio San Leone', 'RIFUGIO', 'Viale dei Pini, Agrigento (AG)', '0922 991122', 100, 85, '2026-06-08 19:46:54'),
(4, 'canicatti', 'Oasi Felina Canicattì', 'GATTILE', 'Via Vittorio Veneto, Canicattì (AG)', '0922 774411', 80, 45, '2026-06-08 19:46:54'),
(5, 'favara', 'Clinica Veterinaria Favara Vet', 'CLINICA_VET', 'Viale S. Angelo, Favara (AG)', '0922 885522', 20, 12, '2026-06-08 19:46:54'),
(6, 'palermo', 'Rifugio Municipale Palermo', 'CANILE', 'Parco della Favorita, Palermo (PA)', '091 668822', 300, 245, '2026-06-08 19:46:54');

-- --------------------------------------------------------

--
-- Struttura della tabella `tipologie_animali`
--

CREATE TABLE `tipologie_animali` (
  `specie_key` varchar(50) NOT NULL,
  `descrizione` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `tipologie_animali`
--

INSERT INTO `tipologie_animali` (`specie_key`, `descrizione`) VALUES
('ALTRO', 'Specie diversa (es. Volatile, Equino, Ovino)'),
('CANE', 'Cane / Canide domestico'),
('GATTO', 'Gatto / Felide domestico');

-- --------------------------------------------------------

--
-- Struttura della tabella `visitor_tracking_logs`
--

CREATE TABLE `visitor_tracking_logs` (
  `id` int NOT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `page_visited` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `comune_selezionato` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `admin_access_logs`
--
ALTER TABLE `admin_access_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `admin_config`
--
ALTER TABLE `admin_config`
  ADD PRIMARY KEY (`key_name`);

--
-- Indici per le tabelle `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indici per le tabelle `citizen_access_logs`
--
ALTER TABLE `citizen_access_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `comuni`
--
ALTER TABLE `comuni`
  ADD PRIMARY KEY (`key_name`);

--
-- Indici per le tabelle `interventi_logs`
--
ALTER TABLE `interventi_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `registro_anagrafica`
--
ALTER TABLE `registro_anagrafica`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `microchip` (`microchip`);

--
-- Indici per le tabelle `ruoli_operatore`
--
ALTER TABLE `ruoli_operatore`
  ADD PRIMARY KEY (`ruolo_key`);

--
-- Indici per le tabelle `segnalazioni`
--
ALTER TABLE `segnalazioni`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codice_tracking` (`codice_tracking`);

--
-- Indici per le tabelle `strutture`
--
ALTER TABLE `strutture`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `tipologie_animali`
--
ALTER TABLE `tipologie_animali`
  ADD PRIMARY KEY (`specie_key`);

--
-- Indici per le tabelle `visitor_tracking_logs`
--
ALTER TABLE `visitor_tracking_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `admin_access_logs`
--
ALTER TABLE `admin_access_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT per la tabella `citizen_access_logs`
--
ALTER TABLE `citizen_access_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `interventi_logs`
--
ALTER TABLE `interventi_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT per la tabella `registro_anagrafica`
--
ALTER TABLE `registro_anagrafica`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT per la tabella `segnalazioni`
--
ALTER TABLE `segnalazioni`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT per la tabella `strutture`
--
ALTER TABLE `strutture`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT per la tabella `visitor_tracking_logs`
--
ALTER TABLE `visitor_tracking_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
