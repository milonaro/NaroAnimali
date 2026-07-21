import React, { useState, useEffect } from 'react';
import AppMap from '@/src/components/map/Map';
import { PawPrint, MapPin, CheckCircle2, User, WifiOff, Dog, Cat, MoreHorizontal, ShieldCheck, Info, Heart, AlertTriangle, Users, Baby, Thermometer, ChevronRight, ArrowLeft, ArrowRight, Camera, Download, FileText, Copy, ExternalLink, X } from 'lucide-react';
import { Segnalazione, AnimalSpecie } from '@/src/types';
import { isInTerritorio } from '@/src/lib/geofence';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineStore } from '@/src/lib/offline';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import PageHeader from '../components/layout/PageHeader';
import { DEFAULT_PRIVACY_TEXT } from '@/src/lib/defaultTexts';
import { parseMarkdownToReact } from '@/src/utils/markdownRenderer';

const ANIMALI_GESTITI = [
  "Piccioni urbani (Columba livia domestica)",
  "Gabbiano reale mediterraneo (Larus michahellis)",
  "Storni (Sturnus vulgaris)",
  "Corvidi (cornacchie, gazze)",
  "Ratti e topi urbani (Rattus norvegicus, Mus musculus)",
  "Cinghiale (Sus scrofa)",
  "Volpe rossa (Vulpes vulpes)",
  "Istrice (Hystrix cristata)",
  "Lepre (Lepus europaeus) in aree periferiche",
  "Bovini (mucche, vitelli)",
  "Ovini (pecore)",
  "Caprini (capre)",
  "Suini allevati",
  "Serpenti autoctoni",
  "Tartarughe abbandonate (es. Trachemys scripta)",
  "Zanzare (Culex, Aedes)",
  "Blatte",
  "Formiche invasive",
  "Processionaria del pino (Thaumetopoea pityocampa)",
  "Colonie di piccioni sovrannumerari",
  "Roditori in reti fognarie",
  "Parassiti urbani legati a rifiuti e degrado",
  "Animali feriti o incidentati su strada",
  "Animali sequestrati o abbandonati in massa",
  "Fauna selvatica in contesto urbano pericoloso"
];

export default function Segnala() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateReport, setDuplicateReport] = useState<{ message: string; code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [formData, setFormData] = useState<Partial<Segnalazione>>({
    specie: undefined,
    condizioni: undefined,
    taglia: undefined,
    colore: "",
    descrizione: "",
    nomeSegnalante: "",
    cognomeSegnalante: "",
    telefonoSegnalante: "",
    emailSegnalante: "",
    consensoPrivacy: false,
    consensoNotifiche: false,
    dichiarazioneVeridicita: false,
    assunzioneResponsabilita: false,
  });

  const [isAltroSelected, setIsAltroSelected] = useState(false);
  const [managedAnimalQuery, setManagedAnimalQuery] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationDetails, setLocationDetails] = useState<{ address: string; placeName: string } | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyText, setPrivacyText] = useState("");

  // Dynamic CMS configurations 
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [activeComune, setActiveComune] = useState("naro");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.siteName) setSiteName(config.siteName);
          if (config.activeComune) setActiveComune(config.activeComune);
          setPrivacyText(config.privacy_text || DEFAULT_PRIVACY_TEXT);
        } else {
          setPrivacyText(DEFAULT_PRIVACY_TEXT);
        }
      } catch (e) {
        setPrivacyText(DEFAULT_PRIVACY_TEXT);
      }
    };
    fetchConfig();

    const checkCitizenAuth = async () => {
      try {
        const storedToken = localStorage.getItem("local_citizen_token");
        const headers: any = {};
        if (storedToken) {
          headers["Authorization"] = `Bearer ${storedToken}`;
        }
        const res = await fetch("/api/otp/me", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user && data.profile) {
            const profile = data.profile;
            setFormData(prev => ({
              ...prev,
              nomeSegnalante: prev.nomeSegnalante || profile.nome || '',
              cognomeSegnalante: prev.cognomeSegnalante || profile.cognome || '',
              telefonoSegnalante: prev.telefonoSegnalante || profile.telefono || '',
              emailSegnalante: prev.emailSegnalante || profile.email || data.user.email || '',
            }));
            setAutoRecoverStatus({
              type: 'success',
              message: `🟢 ACCESSO RILEVATO: I tuoi dati personali sono stati precompilati automaticamente grazie al tuo accesso autenticato.`
            });
          }
        }
      } catch (e) {
        console.error("Errore recupero autenticazione cittadino:", e);
      }
    };
    checkCitizenAuth();

    const handleSync = async () => {
      if (!navigator.onLine) return;
      const pending = OfflineStore.getAll();
      for (const report of pending) {
        try {
          const res = await fetch('/api/segnalazioni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report.data)
          });
          if (res.ok) {
            OfflineStore.remove(report.id);
          }
        } catch (e) {
          console.error("Sync failed for", report.id, e);
        }
      }
    };

    window.addEventListener('online', handleSync);
    return () => window.removeEventListener('online', handleSync);
  }, []);

  const [autoRecoverStatus, setAutoRecoverStatus] = useState<{
    type: 'success' | 'info' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  useEffect(() => {
    const email = formData.emailSegnalante?.trim();
    const tel = formData.telefonoSegnalante?.trim();
    
    if (!email && !tel) return;

    const isEmailOk = typeof email === 'string' && email.includes('@') && email.length > 5;
    const isTelOk = typeof tel === 'string' && tel.length >= 8;

    if (!isEmailOk && !isTelOk) return;

    const timer = setTimeout(async () => {
      try {
        let url = `/api/crosscheck?`;
        if (isEmailOk) url += `email=${encodeURIComponent(email)}`;
        if (isTelOk) {
          if (isEmailOk) url += '&';
          url += `telefono=${encodeURIComponent(tel)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          if (result.found && result.type === 'citizen_profile') {
            const profile = result.data;
            setFormData(prev => ({
              ...prev,
              nomeSegnalante: prev.nomeSegnalante || profile.nome || '',
              cognomeSegnalante: prev.cognomeSegnalante || profile.cognome || '',
              telefonoSegnalante: prev.telefonoSegnalante || profile.telefono || '',
              emailSegnalante: prev.emailSegnalante || profile.email || '',
            }));
            
            setAutoRecoverStatus({
              type: 'success',
              message: `🟢 CODICE CATASTALE / ANAGRAFICA RICONOSCIUTA: Abbiamo individuato la tua scheda nei registri comunali! I tuoi dati sono stati recuperati e inseriti con successo nel modulo dell'intervento.`
            });
          }
        }
      } catch (err) {
        console.error("Errore controllo anagrafica automatica:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.emailSegnalante, formData.telefonoSegnalante]);

  const generateSegnalazionePDF = async (protocolCode?: string) => {
    let photoBase64 = "";
    if (photo) {
      try {
        photoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photo);
        });
      } catch (e) {
        console.error("Errore conversione foto per PDF", e);
      }
    }
    
    const doc = new jsPDF();
    const isDefinitive = !!protocolCode;
    const finalCode = protocolCode || "COF-SEG-PREVIEW";

    // --- STEMMA COMUNALE REALISTICO (Disegnato con primitive jsPDF) ---
    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(0.8);
    doc.setFillColor(248, 250, 252); 
    
    doc.rect(20, 15, 14, 12, 'FD');
    doc.ellipse(27, 27, 7, 5, 'FD'); 

    doc.setFillColor(217, 119, 6); 
    doc.rect(21, 11, 12, 3, 'F');
    doc.rect(21, 9, 2, 2, 'F');
    doc.rect(25, 9, 2, 2, 'F');
    doc.rect(29, 9, 2, 2, 'F');
    doc.rect(31, 9, 2, 2, 'F');

    doc.setDrawColor(59, 130, 246); 
    doc.line(23, 20, 31, 20);
    doc.line(22, 23, 32, 23);
    doc.line(24, 26, 30, 26);

    // --- TESTI INTESTAZIONE COMUNALE ---
    doc.setTextColor(30, 58, 95); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CITTÀ DI NARO", 40, 19);
    
    doc.setTextColor(100, 116, 139); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Provincia di Agrigento", 40, 23);
    
    doc.setTextColor(71, 85, 105); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("SETTORE VIGILANZA E SANITÀ ANIMALE", 40, 28);
    
    doc.setTextColor(148, 163, 184); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Ufficio Tutela Ambientale e Gestione Territoriale del Randagismo", 40, 32);

    // Protocol info box (Top right)
    doc.setFillColor(241, 245, 249); 
    doc.rect(135, 12, 55, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(135, 12, 55, 22, 'D');

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("REGISTRO SEGNALAZIONI", 140, 17);
    
    doc.setTextColor(15, 118, 110); 
    doc.setFontSize(8);
    doc.text(isDefinitive ? "STATO: TRASMESSO" : "ANTEPRIMA DI STAMPA", 140, 22);

    doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Prot.: ${finalCode}`, 140, 29);

    // Separatore orizzontale
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(1.5);
    doc.line(20, 39, 190, 39);

    // --- TITOLO DOCUMENTO ---
    doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("VERBALE DI SEGNALAZIONE DI ANIMALE RANDAGIO O IN DIFFICOLTÀ", 105, 48, { align: 'center' });
    
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Redatto ai sensi del D.P.R. 445/2000 in materia di dichiarazioni sostitutive e della L.R. Siciliana n. 15/2000", 105, 53, { align: 'center' });

    // --- SEZIONE 1: DATI DEL SEGNALANTE (DICHIARANTE) ---
    doc.setFillColor(30, 58, 95);
    doc.rect(20, 58, 170, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("SEZIONE I - DICHIARANTE / RECAPITO SEGNALANTE", 23, 62);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, 64, 170, 24, 'D');
    doc.line(20, 76, 190, 76); 
    doc.line(105, 64, 105, 88); 

    // Riquadro 1: Cognome e Nome
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("COGNOME E NOME:", 22, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 95);
    doc.text(`${(formData.nomeSegnalante || '').toUpperCase()} ${(formData.cognomeSegnalante || '').toUpperCase()}`, 22, 73);

    // Riquadro 2: Recapito Telefonico
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("TELEFONO / RECAPITO:", 107, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 95);
    doc.text(`${formData.telefonoSegnalante || 'Non specificato'}`, 107, 73);

    // Riquadro 3: Email
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("INDIRIZZO EMAIL CONTATTO:", 22, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`${formData.emailSegnalante || 'Non specificato'}`, 22, 84);

    // Riquadro 4: Data e Ora Accettazione
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("DATA E ORA COMPILAZIONE:", 107, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    doc.text(`${new Date().toLocaleString('it-IT')}`, 107, 84);


    // --- SEZIONE 2: DATI DELL'ANIMALE ---
    doc.setFillColor(30, 58, 95);
    doc.rect(20, 93, 170, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("SEZIONE II - SCHEDA DI RILEVAMENTO SOGGETTO (ANIMALE)", 23, 97);

    const hasPhotoObj = !!photoBase64;
    const rightBoundaryX = hasPhotoObj ? 140 : 190;
    const rightColWidth = hasPhotoObj ? 120 : 170;

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, 99, rightColWidth, 36, 'D');
    doc.line(20, 111, rightBoundaryX, 111);
    doc.line(20, 123, rightBoundaryX, 123);
    
    const midpointX = hasPhotoObj ? 80 : 105;
    doc.line(midpointX, 99, midpointX, 123);

    // Riquadro Specie
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("SPECIE / SOGGETTO:", 22, 103);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 95);
    doc.text(`${(formData.specie || 'Non specificata').toUpperCase()}`, 22, 108);

    // Riquadro Taglia
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("TAGLIA PREVISTA:", midpointX + 2, 103);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 95);
    doc.text(`${(formData.taglia || 'N.D.').toUpperCase()}`, midpointX + 2, 108);

    // Riquadro Condizioni
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("STATO SANITARIO E CONDIZIONI:", 22, 115);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28); 
    doc.text(`${(formData.condizioni || 'NORMALE').toUpperCase()}`, 22, 120);

    // Riquadro Colore
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("COLORE MANTELLO / SEGNI:", midpointX + 2, 115);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`${formData.colore || 'Non specificato'}`, midpointX + 2, 120);

    // Note descrittive
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("DESCRIZIONE DETTAGLIATA O ANOMALIE COMPORTAMENTALI:", 22, 127);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(formData.descrizione || "Nessun dettaglio aggiuntivo descritto dal dichiarante originario.", rightColWidth - 4);
    doc.text(splitNotes, 22, 131.5);

    if (hasPhotoObj) {
      doc.rect(142, 99, 48, 36, 'D');
      try {
        doc.addImage(photoBase64, "JPEG", 143, 100, 46, 34);
      } catch (err) {
        console.error("Non-critical: Image adding failed in PDF", err);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("[Impossibile inserire foto]", 166, 118, { align: 'center' });
      }
    }


    // --- SEZIONE 3: LOCALIZZAZIONE E RIFERIMENTI ---
    doc.setFillColor(30, 58, 95);
    doc.rect(20, 140, 170, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("SEZIONE III - GEO-LOCALIZZAZIONE E RIFERIMENTI TERRITORIALI", 23, 144);

    doc.rect(20, 146, 170, 24, 'D');
    doc.line(20, 158, 190, 158);
    doc.line(105, 158, 105, 170); 

    // Indirizzo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("INDIRIZZO RILEVATO DEL RITROVAMENTO:", 22, 150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    const splitAddr = doc.splitTextToSize(locationDetails?.address || "Coordinate definite manualmente sulla mappa interattiva", 164);
    doc.text(splitAddr, 22, 154.5);

    // Latitudine
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("COORD. LATITUDINE:", 22, 162);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    doc.text(`${location?.lat.toFixed(6) || '0.000000'}`, 22, 166.5);

    // Longitudine
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(115, 115, 115);
    doc.text("COORD. LONGITUDINE:", 107, 162);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 95);
    doc.text(`${location?.lng.toFixed(6) || '0.000000'}`, 107, 166.5);


    // --- SEZIONE 4: DICHIARAZIONE D'ASSUNZIONE DI RESPONSABILITÀ ---
    doc.setFillColor(254, 243, 199); 
    doc.rect(20, 175, 170, 17, 'F');
    doc.setDrawColor(245, 158, 11); 
    doc.rect(20, 175, 170, 17, 'D');

    doc.setTextColor(146, 64, 14); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Dichiarazione Sostitutiva ai Sensi del DPR 445/2000 & Assunzione di Responsabilità Legale", 23, 179);
    
    doc.setTextColor(120, 53, 4); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const txtLaw = "Il dichiarante sopra indicato sottoscrive la veridicità delle dichiarazioni rese ai sensi e per gli effetti dello Statuto della Città di Naro e delle Leggi penali dello Stato, consapevole che le dichiarazioni false ed i procurati allarmi sono puniti e qualificati come reato d'ufficio e segnalati all'Autorità Giudiziaria.";
    const splitLaw = doc.splitTextToSize(txtLaw, 164);
    doc.text(splitLaw, 23, 183);


    // --- SOTTOSCRIZIONI (FIRME) ---
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`Naro (AG), lì ${new Date().toLocaleDateString('it-IT')}`, 20, 203);

    doc.setFontSize(7.5);
    doc.text("IL DICHIARANTE (SEGNALANTE)", 35, 209, { align: 'center' });
    doc.line(20, 227, 75, 227); 
    
    doc.text("IL FUNZIONARIO RILEVATORE", 155, 209, { align: 'center' });
    doc.line(135, 227, 190, 227); 
    
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "italic");
    doc.text("(Firma autografa digitale protocollata)", 35, 231, { align: 'center' });
    doc.text("(Timbro d'Ufficio e firma per presa in carico)", 155, 231, { align: 'center' });


    // --- PIE' DI PAGINA ISTITUZIONALE ---
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(20, 240, 190, 240);

    doc.setTextColor(148, 163, 184); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Servizio Integrato di Tutela e di Controllo del Randagismo - Comune di Naro (AG) - Piazza Garibaldi, 1", 105, 245, { align: 'center' });
    doc.text("Piattaforma Digitale Civica AnimalHub PA - Questo file PDF è un documento valido ai fini delle sanzioni penali e civili", 105, 249, { align: 'center' });

    doc.save(`Verbale_Segnalazione_${finalCode}.pdf`);
  };

  const steps = [
    { id: 1, label: 'Dove' },
    { id: 2, label: 'Animale' },
    { id: 3, label: 'I tuoi dati' },
    { id: 4, label: 'Conferma' }
  ];

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: {
          'Accept-Language': 'it,en',
          'User-Agent': 'AnimalHubPA'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `Naro, Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        const placeName = data.name || data.address?.road || data.address?.suburb || data.address?.village || "Posizione Rilevata";
        setLocationDetails({ address, placeName });
        setFormData(prev => ({ ...prev, indirizzo: address }));
      } else {
        throw new Error("Geocoding failed");
      }
    } catch (e) {
      console.error(e);
      const address = `Naro (AG), Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      const placeName = `Zona di Naro`;
      setLocationDetails({ address, placeName });
      setFormData(prev => ({ ...prev, indirizzo: address }));
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (!isInTerritorio(lat, lng)) {
      setError("La posizione selezionata è fuori dal territorio del Comune di Naro.");
      setLocation(null);
      setLocationDetails(null);
    } else {
      setError(null);
      setLocation({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas conversion failed'));
            },
            'image/jpeg',
            0.7 // quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async () => {
    if (!location || 
        !formData.nomeSegnalante || 
        !formData.cognomeSegnalante || 
        !formData.telefonoSegnalante || 
        !formData.emailSegnalante || 
        !formData.consensoPrivacy ||
        !formData.dichiarazioneVeridicita || 
        !(formData as any).assunzioneResponsabilita
    ) {
      setError("Tutti i campi relativi alla tua identità e le dichiarazioni legali di responsabilità ai sensi del DPR 445/2000 devono essere compilati e accettati per poter completare l'invio protocollato.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        OfflineStore.save({
          ...formData,
          lat: location.lat,
          lng: location.lng,
          fotoUrl: "",
          indirizzo: "Località salvata (Offline)",
        } as any);
        setIsOfflineMode(true);
        setSuccess("OFFLINE_CACHED");
        return;
      }

      let fotoUrl = "";
      if (photo) {
        const compressedBlob = await compressImage(photo);
        
        // Convert Blob to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });

        // Caricamento locale sul server
        const uploadRes = await fetch('/api/segnalazioni/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: photo.name,
            base64: base64Data
          })
        });

        if (!uploadRes.ok) {
          throw new Error("Impossibile caricare l'immagine sul server remoto.");
        }

        const uploadData = await uploadRes.json();
        if (uploadData.error) throw new Error(uploadData.error);
        fotoUrl = uploadData.url;
      }

      const res = await fetch('/api/segnalazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: location.lat,
          lng: location.lng,
          fotoUrl,
          indirizzo: locationDetails?.address || "Località rilevata da mappa",
        })
      });

      const data = await res.json();
      if (data.error) {
        if (data.duplicateReportDetected) {
          setDuplicateReport({
            message: data.error,
            code: data.duplicateCode || "TRK-2026-N1"
          });
        }
        throw new Error(data.error);
      }

      setSuccess(data.codiceTracking);
    } catch (err: any) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const isCached = success === "OFFLINE_CACHED";
    return (
      <div className="max-w-xl mx-auto pt-40 pb-24 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isCached ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {isCached ? <WifiOff className="h-10 w-10 text-amber-600" /> : <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
            {isCached ? 'Segnalazione Salvata' : 'Segnalazione Inviata!'}
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
            {isCached 
              ? 'Connessione assente. La segnalazione verrà inviata automaticamente appena tornerai online.' 
              : 'Grazie per il tuo contributo. Gli operatori prenderanno in carico la segnalazione a breve.'}
          </p>

          {!isCached && (
            <>
              <div className="bg-gray-50 border border-gray-100 p-8 rounded-lg mb-6">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Codice di Tracking</p>
                 <span className="text-3xl font-bold text-[#1e3a5f] tracking-widest uppercase">{success}</span>
              </div>
              
              <div className="max-w-md mx-auto mb-8">
                <button 
                  onClick={() => generateSegnalazionePDF(success)} 
                  className="w-full bg-[#1e3a5f] hover:bg-[#101b3a] text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1e3a5f]/20 transition-all active:scale-95 cursor-pointer text-sm"
                >
                  <Download className="h-4.5 w-4.5" /> Scarica Verbale Ufficiale (PDF)
                </button>
              </div>
            </>
          )}

          <button onClick={() => window.location.href = '/'} className="text-[#15803d] font-bold flex items-center gap-2 mx-auto hover:underline">
            Torna alla Home <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen" style={{ borderWidth: '0px', paddingTop: '110px' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col gap-6 flex-1 animate-fadeIn">
        
        <PageHeader
          sopraTitolo="Protocollo Civico Digitale"
          titolo="Nuova Segnalazione"
          sottotitolo={`Comune di ${siteName.replace(/^Comune di\s+/i, "")}`}
        >
          {/* Step indicator compatto orizzontale in header */}
          <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 p-2.5 px-3.5 rounded-xl max-w-full shadow-md">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                    step === s.id ? 'bg-[#15803d] text-white shadow-md scale-110' : 
                    step > s.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-300/60 border border-white/5'
                  }`}>
                    {step > s.id ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : s.id}
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${
                    step === s.id ? 'text-emerald-300' : 
                    step > s.id ? 'text-emerald-400' : 'text-slate-300/60'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-[2px] w-3 md:w-6 rounded-full ${step > s.id ? 'bg-emerald-450' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </PageHeader>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }}
          className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex flex-col w-full"
        >
          {/* Visual Progress Bar and Percentage Tracker */}
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 md:px-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-[#15803d] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Progresso Compilazione
              </span>
              <span className="text-[10px] font-black text-[#101b3a] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                {Math.round((step / steps.length) * 100)}% Completato
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200 p-[1px]">
              <motion.div
                className="h-full bg-[#15803d] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="p-6 md:p-10 flex-1">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-3.5 mb-6 shadow-sm text-left"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-red-850">Errore durante l'invio della segnalazione</h4>
                  <p className="text-xs text-red-700 mt-1 font-semibold leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <div className="space-y-8 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><MapPin className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Dove si trova l'animale?</h2>
                       <p className="text-gray-500 text-sm">Clicca sulla mappa per indicare la posizione esatta della segnalazione.</p>
                     </div>
                  </div>
                  {location && (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all shadow-lg shadow-[#15803d]/30"
                    >
                      Avanti <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="h-[450px] md:h-[550px] w-full rounded-lg overflow-hidden border border-gray-100 relative shadow-inner">
                  <AppMap interactive onLocationSelect={handleLocationSelect} hideFilters />
                </div>
                {location && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Posizione Rilevata</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#15803d] shrink-0" />
                        {isGeocoding ? (
                          <span className="text-xs text-slate-400 font-medium">Calcolo indirizzo...</span>
                        ) : (
                          <p className="text-xs md:text-sm font-black text-[#1e3a5f] leading-relaxed">
                            {locationDetails?.address || "Coordinate definite sulla mappa"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200/60 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Coordinate (Lat, Lng)</span>
                        <span className="text-xs font-mono font-bold text-[#15803d]">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-[#15803d] uppercase tracking-wider">Mappa OK</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

             {step === 2 && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><PawPrint className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Che animale hai visto?</h2>
                       <p className="text-gray-500 text-sm">Identifica la specie e le condizioni del soggetto.</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
                    </button>
                    {(formData.specie && formData.condizioni && formData.taglia) && (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Specie *</label>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {[
                        { id: AnimalSpecie.CANE, label: 'Cane', icon: <Dog className="h-5 w-5 md:h-6 md:w-6" />, active: formData.specie === AnimalSpecie.CANE },
                        { id: AnimalSpecie.GATTO, label: 'Gatto', icon: <Cat className="h-5 w-5 md:h-6 md:w-6" />, active: formData.specie === AnimalSpecie.GATTO },
                        { id: AnimalSpecie.ALTRO, label: 'Altro', icon: <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" />, active: (formData.specie !== undefined && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO) || isAltroSelected }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id === AnimalSpecie.ALTRO) {
                              setFormData({ ...formData, specie: undefined });
                              setIsAltroSelected(true);
                            } else {
                              setFormData({ ...formData, specie: item.id });
                              setIsAltroSelected(false);
                            }
                          }}
                          className={`p-3 md:p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-2 md:gap-3 cursor-pointer ${
                            item.active ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {item.icon}
                          <span className="font-black text-xs md:text-sm tracking-wider">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Managed Animals from AnimaliGestiti.md */}
                  {(isAltroSelected || (formData.specie !== undefined && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO)) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-black text-[#1e3a5f] uppercase tracking-wide">
                            Seleziona Animale Gestito dal Comune
                          </h3>
                          <p className="text-gray-500 text-xs mt-1">
                            Seleziona uno dei soggetti tutelati ai sensi del file comunale AnimaliGestiti.md.
                          </p>
                        </div>
                        {formData.specie && formData.specie !== AnimalSpecie.CANE && formData.specie !== AnimalSpecie.GATTO && (
                          <div className="px-4 py-2 bg-[#15803d]/10 border border-[#15803d]/20 rounded-lg text-xs font-bold text-[#15803d] flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> Selezionato: <strong className="uppercase">{formData.specie}</strong>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cerca animale (es. Cinghiale, Volpe, Piccione...)"
                          className="w-full bg-white border border-slate-200 px-4 py-3 rounded-lg focus:border-[#15803d] focus:outline-none text-sm placeholder-slate-400 font-medium"
                          value={managedAnimalQuery}
                          onChange={(e) => setManagedAnimalQuery(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {ANIMALI_GESTITI.filter(animal => 
                          animal.toLowerCase().includes(managedAnimalQuery.toLowerCase())
                        ).map((animal) => {
                          const isSelected = formData.specie === animal;
                          return (
                            <button
                              key={animal}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, specie: animal as any });
                                setIsAltroSelected(true);
                              }}
                              className={`p-3 text-left rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#15803d] text-white border-[#15803d]' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <span>{animal}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4 flex items-center gap-2">Taglia * <Info className="h-3 w-3" /></label>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      {['PICCOLA', 'MEDIA', 'GRANDE'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, taglia: t as any })}
                          className={`p-3 md:p-4 rounded-lg border-2 font-black text-[10px] md:text-xs tracking-wider transition-all cursor-pointer ${
                            formData.taglia === t ? 'border-[#15803d] bg-emerald-50 text-[#15803d]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Condizioni *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                      {[
                        { id: 'NORMALE', label: 'Normale', icon: <Heart className="h-4 w-4 md:h-5 md:w-5" /> },
                        { id: 'FERITO', label: 'Ferito', icon: <Thermometer className="h-4 w-4 md:h-5 md:w-5" /> },
                        { id: 'AGGRESSIVO', label: 'Aggressivo', icon: <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" /> },
                        { id: 'CUCCIOLO', label: 'Cucciolo', icon: <Baby className="h-4 w-4 md:h-5 md:w-5" /> },
                        { id: 'BRANCO', label: 'Branco', icon: <Users className="h-4 w-4 md:h-5 md:w-5" /> }
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, condizioni: c.id })}
                          className={`p-3 md:p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 md:gap-2 cursor-pointer ${
                            formData.condizioni === c.id 
                              ? `border-[#15803d] bg-emerald-50 text-[#15803d]` 
                              : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {c.icon}
                          <span className="font-bold text-[9px] md:text-[10px] uppercase tracking-wider">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">Colore mantello</label>
                        <input 
                           type="text" 
                           placeholder="es. Marrone e bianco"
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                           value={formData.colore}
                           onChange={(e) => setFormData({ ...formData, colore: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">Descrizione aggiuntiva</label>
                        <input 
                           type="text" 
                           placeholder="Note utili agli operatori..."
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-lg focus:bg-white focus:border-[#15803d] outline-none"
                           value={formData.descrizione}
                           onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                        />
                     </div>
                  </div>

                  {/* Modulo A - Photo Upload Section */}
                  <div className="border-t border-gray-100 pt-8">
                     <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4 flex items-center gap-2">
                       Carica Foto dell'Animale <span className="normal-case text-gray-400 font-medium">(Obbligatorio per Modulo A)</span>
                     </label>
                     
                     <div 
                       onDragOver={(e) => e.preventDefault()}
                       onDrop={(e) => {
                         e.preventDefault();
                         if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                           setPhoto(e.dataTransfer.files[0]);
                         }
                       }}
                       className="border-2 border-dashed border-gray-200 hover:border-[#15803d] rounded-xl p-8 bg-gray-50/50 transition-all text-center relative cursor-pointer"
                     >
                       {photo ? (
                         <div className="space-y-4">
                           <div className="relative inline-block w-40 h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm mx-auto">
                             <img 
                               src={URL.createObjectURL(photo)} 
                               alt="Anteprima" 
                               className="w-full h-full object-cover"
                             />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-700">{photo.name}</p>
                             <p className="text-[10px] text-gray-400">{(photo.size / 1024).toFixed(1)} KB</p>
                           </div>
                           <button
                             type="button"
                             onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                             className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all border border-red-100 mx-auto"
                           >
                             Rimuovi foto
                           </button>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                             <Camera className="h-6 w-6" />
                           </div>
                           <div className="text-xs font-bold text-slate-600">
                             Trascina qui la foto dallo smartphone/PC oppure <span className="text-[#15803d] underline">Sfoglia i file</span>
                           </div>
                           <p className="text-[10px] text-gray-400">Supporta JPEG, PNG. Puoi scattarla direttamente sul posto.</p>
                           <input 
                             type="file" 
                             accept="image/*" 
                             capture="environment"
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                             onChange={(e) => {
                               if (e.target.files && e.target.files[0]) {
                                 setPhoto(e.target.files[0]);
                               }
                             }}
                           />
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-50 text-[#15803d] rounded-lg"><User className="h-6 w-6" /></div>
                     <div>
                       <h2 className="text-2xl font-bold text-[#1e3a5f]">Dati personali e Dichiarazioni</h2>
                       <p className="text-gray-500 text-sm">Inserisci i tuoi contatti e firma le dichiarazioni di veridicità richieste per legge.</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full md:w-auto bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="h-5 w-5" /> <span className="md:hidden">Indietro</span>
                    </button>
                    {(formData.nomeSegnalante && formData.cognomeSegnalante && formData.telefonoSegnalante && formData.emailSegnalante && formData.consensoPrivacy && formData.dichiarazioneVeridicita && formData.assunzioneResponsabilita) ? (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="w-full md:w-auto bg-[#15803d] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full md:w-auto bg-gray-100 text-gray-400 px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200/60"
                        title="Compila tutti i campi obbligatori e firma le dichiarazioni legali per procedere"
                      >
                        Avanti <ArrowRight className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {autoRecoverStatus.message && (
                  <div className={`p-4 rounded-xl mb-4 border text-[11px] font-extrabold transition-all leading-relaxed ${
                    autoRecoverStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {autoRecoverStatus.message}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Nome *</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
                      placeholder="Il tuo nome"
                      value={formData.nomeSegnalante}
                      onChange={(e) => setFormData({ ...formData, nomeSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Cognome *</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
                      placeholder="Il tuo cognome"
                      value={formData.cognomeSegnalante}
                      onChange={(e) => setFormData({ ...formData, cognomeSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Telefono *</label>
                    <input
                      type="tel"
                      className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
                      placeholder="Inserisci il tuo numero di telefono"
                      value={formData.telefonoSegnalante}
                      onChange={(e) => setFormData({ ...formData, telefonoSegnalante: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]">Email *</label>
                    <input
                      type="email"
                      className="w-full bg-white border border-gray-200 p-4 rounded-lg focus:border-[#15803d] outline-none transition-all shadow-sm"
                      placeholder="la.tua@email.it"
                      value={formData.emailSegnalante}
                      onChange={(e) => setFormData({ ...formData, emailSegnalante: e.target.value })}
                    />
                  </div>
                </div>

                {/* Sezione Autocertificazione DPR 445/2000 */}
                <div className="bg-gray-50 border border-gray-200 p-6 md:p-10 rounded-xl relative space-y-4">
                  <ShieldCheck className="absolute top-6 right-6 h-8 w-8 text-indigo-100 invisible md:visible" />
                  <div className="prose prose-sm text-gray-600 max-w-none space-y-4">
                    <p className="font-bold flex items-center gap-2 text-[#1e3a5f]">
                      <Info className="h-4 w-4 text-emerald-600" />
                      Dichiarazione sostitutiva di certificazione (DPR n. 445/2000)
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Il/la sottoscritt/a <strong className="text-slate-800">{formData.nomeSegnalante || '_________________'} {formData.cognomeSegnalante || '_________________'}</strong>, consapevole delle sanzioni penali previste dall'art. 76 del DPR 445/2000 per le ipotesi di falsità in atti e dichiarazioni mendaci,
                    </p>
                    <p className="font-black uppercase tracking-widest text-xs text-[#1e3a5f]">DICHIARA SOTTO LA PROPRIA RESPONSABILITÀ</p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      che i dati forniti nella presente segnalazione — relativi allo stato, alle condizioni, alla specie dell'animale, alla localizzazione dell'evento e ai propri dati anagrafici — sono veritieri e corrispondenti alla realtà dei fatti constatata personalmente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Checkbox 1: Privacy policy (Required) */}
                  <label className="flex gap-4 p-5 bg-white border border-gray-150 rounded-lg cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.consensoPrivacy}
                      onChange={(e) => setFormData({ ...formData, consensoPrivacy: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e3a5f]">Accetto la Privacy Policy *</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        I dati forniti sono trattati secondo il Regolamento GDPR.{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPrivacyModalOpen(true);
                          }}
                          className="text-[#15803d] font-bold hover:underline cursor-pointer focus:outline-none"
                        >
                          Leggi Privacy Policy
                        </button>
                      </span>
                    </div>
                  </label>

                  {isPrivacyModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-150 animate-scaleIn">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <h3 className="text-lg font-black text-[#1e3a5f] flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-[#15803d]" />
                            Informativa Privacy (Regolamento GDPR)
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsPrivacyModalOpen(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto text-sm leading-relaxed text-slate-600 space-y-4 font-sans max-h-[55vh]">
                          {parseMarkdownToReact(privacyText || DEFAULT_PRIVACY_TEXT)}
                        </div>
                        <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, consensoPrivacy: true });
                              setIsPrivacyModalOpen(false);
                            }}
                            className="px-6 py-2.5 bg-[#15803d] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#15803d]/90 shadow-md hover:shadow-lg transition-all"
                          >
                            Accetta e Chiudi
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Checkbox 2: Notifiche email (Optional) */}
                  <label className="flex gap-4 p-5 bg-white border border-gray-150 rounded-lg cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.consensoNotifiche}
                      onChange={(e) => setFormData({ ...formData, consensoNotifiche: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-600">Invio notifiche automatiche (Facoltativo)</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Acconsento a ricevere aggiornamenti sullo stato di avanzamento dell'intervento via email.</span>
                    </div>
                  </label>

                  {/* Checkbox 3: Veridicita (Required) */}
                  <label className="flex gap-4 p-5 bg-[#15803d]/5 border border-[#15803d]/20 rounded-lg cursor-pointer hover:bg-[#15803d]/10 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d]"
                      checked={formData.dichiarazioneVeridicita}
                      onChange={(e) => setFormData({ ...formData, dichiarazioneVeridicita: e.target.checked })}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e3a5f]">Autocertificazione di veridicità ai sensi del DPR 445/2000 *</span>
                      <span className="text-[10px] text-[#15803d] font-bold uppercase tracking-widest mt-0.5">Obbligatorio ai fini della corretta assunzione in carico del protocollo digitale</span>
                    </div>
                  </label>

                  {/* Checkbox 4: Responsabilità (Required) */}
                  <label className="flex gap-4 p-5 bg-amber-50/50 border border-amber-200/80 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                      checked={(formData as any).assunzioneResponsabilita}
                      onChange={(e) => setFormData({ ...formData, assunzioneResponsabilita: e.target.checked } as any)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e3a5f]">Assunzione di responsabilità penale e legale *</span>
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">La segnalazione non è anonima e l'abuso/falso allarme è perseguibile</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10 py-6">
                 {/* Navigation header inside step */}
                 <div className="flex justify-between items-center w-full">
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#1e3a5f] transition-all cursor-pointer shadow-sm text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" /> <span>Indietro</span>
                    </button>
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-[#15803d] uppercase tracking-wider">Riepilogo Pronto</span>
                    </div>
                 </div>

                 {/* Success Badge */}
                 <div className="text-center space-y-3">
                   <div className="w-16 h-16 bg-emerald-50 text-[#15803d] rounded-full flex items-center justify-center mx-auto shadow-md">
                      <ShieldCheck className="h-8 w-8" />
                   </div>
                   <h2 className="text-3xl font-black text-[#1e3a5f] tracking-tight">Rivedi la tua Segnalazione</h2>
                   <p className="text-gray-500 text-sm max-w-lg mx-auto">
                     Verifica attentamente tutti i dettagli inseriti. Una volta cliccato su "Invia", la segnalazione verrà registrata nel protocollo comunale digitale di Naro.
                   </p>
                 </div>

                 {/* Detailed Sections Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                   {/* Col 1: Animale & Allegati */}
                   <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-4">
                     <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                       <PawPrint className="h-4 w-4 text-[#15803d]" />
                       Animale Segnalato
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Specie</span>
                         <span className="font-bold text-sm text-[#1e3a5f] uppercase block">{formData.specie}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Taglia</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">{formData.taglia || 'N.D.'}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Condizioni</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">
                           <span className="px-2 py-0.5 bg-[#15803d]/10 border border-[#15803d]/20 rounded text-xs font-extrabold text-[#15803d] uppercase inline-block mt-0.5">
                             {formData.condizioni}
                           </span>
                         </span>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Colore Mantello</span>
                         <span className="font-bold text-sm text-[#1e3a5f] block">{formData.colore || 'Non specificato'}</span>
                       </div>
                     </div>
                     
                     {formData.descrizione && (
                       <div className="bg-white p-3 rounded-lg border border-slate-200/40">
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Note / Descrizione</span>
                         <p className="text-xs text-slate-600 leading-relaxed font-medium">"{formData.descrizione}"</p>
                       </div>
                     )}

                     {/* Image Thumbnail inside review if available */}
                     {photo && (
                       <div className="bg-white p-3 rounded-lg border border-slate-200/40 flex items-center gap-3">
                         <div className="h-12 w-12 rounded overflow-hidden border border-slate-200 shrink-0">
                           <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="min-w-0">
                           <span className="text-[9px] font-bold text-slate-400 uppercase block">Fotografia Allegata</span>
                           <p className="text-xs font-bold text-slate-700 truncate">{photo.name}</p>
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Col 2: Posizione & Segnalante */}
                   <div className="space-y-6">
                     {/* Posizione Card */}
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-3">
                       <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                         <MapPin className="h-4 w-4 text-[#15803d]" />
                         Localizzazione
                       </h3>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Indirizzo Rilevato</span>
                         <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">
                           {locationDetails?.address || "Coordinate sulla mappa"}
                         </p>
                       </div>
                       <div className="flex justify-between items-center">
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block">Coordinate Geografiche</span>
                           <span className="text-xs font-mono font-semibold text-slate-600">
                             {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                           </span>
                         </div>
                         <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                           In Territorio Naro
                         </span>
                       </div>
                     </div>

                     {/* Segnalante Card */}
                     <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 space-y-3">
                       <h3 className="text-xs font-black text-[#1e3a5f] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                         <User className="h-4 w-4 text-[#15803d]" />
                         Dati del Segnalante
                       </h3>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Nome & Cognome</span>
                           <span className="font-bold text-xs text-[#1e3a5f] block">
                             {formData.nomeSegnalante} {formData.cognomeSegnalante}
                           </span>
                         </div>
                         <div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Telefono</span>
                           <span className="font-bold text-xs text-[#1e3a5f] block">{formData.telefonoSegnalante}</span>
                         </div>
                       </div>
                       <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Indirizzo Email</span>
                         <span className="font-bold text-xs text-slate-600 block truncate">{formData.emailSegnalante}</span>
                       </div>
                       
                       {/* Consent Checklist status representation */}
                       <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                           <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                           Conformità Privacy & DPR 445/2000
                         </div>
                         {formData.consensoNotifiche ? (
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 rounded px-2 py-0.5 mt-1 self-start">
                             <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                             Notifiche Email Attive
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                             Nessun invio notifiche automatiche richiesto
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Action Panel */}
                 <div className="pt-6 border-t border-slate-100 text-center space-y-4 flex flex-col items-center">
                   <button
                     type="button"
                     onClick={() => generateSegnalazionePDF()}
                     className="w-full md:w-[350px] bg-white border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/5 px-8 py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-sm"
                   >
                     <FileText className="h-4.5 w-4.5" /> Genera Anteprima Verbale (PDF)
                   </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full md:w-[350px] mx-auto bg-[#15803d] text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-all cursor-pointer shadow-lg shadow-[#15803d]/30 disabled:opacity-50 text-base"
                    >
                      {loading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Invia Segnalazione Ufficiale <ArrowRight className="h-5 w-5" /></>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider max-w-sm mx-auto">
                      Cliccando dichiari la veridicità delle informazioni inserite ai sensi delle norme vigenti.
                    </p>
                 </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      <p className="text-center text-slate-700 text-[10px] font-bold mt-12 uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed">
        Il sistema AnimalHub PA è una piattaforma ufficiale del {siteName}. Le segnalazioni mendaci sono punite ai sensi della legge italiana (art. 76 del D.P.R. 445/2000 e art. 483 del Codice Penale).
      </p>
    </div>

    <AnimatePresence>
      {duplicateReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-amber-200 shadow-2xl p-6 md:p-8 max-w-lg w-full relative overflow-hidden text-left"
          >
            {/* Decorative top amber bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500 animate-pulse" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
                <AlertTriangle className="h-8 w-8 animate-bounce" />
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100/60 rounded-full px-3 py-1 uppercase tracking-widest inline-block">
                  Segnalazione Duplicata Rilevata
                </span>
                <h3 className="text-xl md:text-2xl font-black text-[#1e3a5f] tracking-tight leading-snug">
                  Intervento Già Attivo
                </h3>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 w-full text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Codice Tracking</span>
                    <span className="text-base font-mono font-black text-[#1e3a5f] uppercase tracking-wider">
                      {duplicateReport.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(duplicateReport.code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] font-black text-[#15803d] hover:text-[#166534] bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-200 rounded-lg px-2.5 py-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copia Codice</span>
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {duplicateReport.message}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateReport(null);
                    setError(null);
                  }}
                  className="w-full bg-white border border-gray-200 text-slate-600 hover:bg-slate-50 font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  Ho Capito
                </button>
                <Link
                  to="/mia-area"
                  className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Traccia Interventi</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
}
