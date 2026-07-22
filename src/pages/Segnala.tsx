import React, { useState, useEffect } from 'react';
import { CheckCircle2, WifiOff, ChevronRight, AlertTriangle, Download, Copy, ExternalLink } from 'lucide-react';
import { Segnalazione } from '@/src/types';
import { isInTerritorio, COMUNI } from '@/src/lib/geofence';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineStore } from '@/src/lib/offline';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';
import { drawInstitutionalHeader, drawInstitutionalFooter } from '@/src/lib/pdfgenerator';
import PageHeader from '../components/layout/PageHeader';
import { DEFAULT_PRIVACY_TEXT } from '@/src/lib/defaultTexts';

// Componenti modulari estratti
import MappaSelezionePosizione from '../components/segnalazioni/MappaSelezionePosizione';
import ModuloDatiAnimale from '../components/segnalazioni/ModuloDatiAnimale';
import ModuloDatiSegnalante from '../components/segnalazioni/ModuloDatiSegnalante';
import RiepilogoInvio from '../components/segnalazioni/RiepilogoInvio';

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
  const [fullConfig, setFullConfig] = useState<any>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          setFullConfig(config);
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

    // Use shared institutional header
    drawInstitutionalHeader(doc, {
      siteName: fullConfig.siteName || siteName,
      comune_provincia: fullConfig.comune_provincia || 'Agrigento',
      activeComune: activeComune,
      pec: fullConfig.comune_pec
    }, {
      title: "REGISTRO SEGNALAZIONI",
      code: `Prot.: ${finalCode}`,
      status: isDefinitive ? "STATO: TRASMESSO" : "ANTEPRIMA DI STAMPA"
    });

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
    const comuneUpper = (fullConfig.siteName || siteName || `Comune di ${activeComune}`).toUpperCase();
    const footerEnteName = comuneUpper.startsWith("COMUNE DI") ? comuneUpper.replace("COMUNE DI ", "CITTÀ DI ") : `CITTÀ DI ${activeComune.toUpperCase()}`;
    const txtLaw = `Il dichiarante sopra indicato sottoscrive la veridicità delle dichiarazioni rese ai sensi e per gli effetti dello Statuto della ${footerEnteName} e delle Leggi penali dello Stato, consapevole che le dichiarazioni false ed i procurati allarmi sono puniti e qualificati come reato d'ufficio e segnalati all'Autorità Giudiziaria.`;
    const splitLaw = doc.splitTextToSize(txtLaw, 164);
    doc.text(splitLaw, 23, 183);


    // --- SOTTOSCRIZIONI (FIRME) ---
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const comuneName = COMUNI[activeComune]?.name || activeComune;
    const prov = fullConfig.comune_provincia || 'AG';
    doc.text(`${comuneName} (${prov}), lì ${new Date().toLocaleDateString('it-IT')}`, 20, 203);

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
    drawInstitutionalFooter(doc, {
      siteName: fullConfig.siteName || siteName,
      comune_provincia: fullConfig.comune_provincia || 'Agrigento',
      activeComune: activeComune,
      pec: fullConfig.comune_pec
    });

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
      setError(`La posizione selezionata è fuori dal territorio del ${fullConfig.siteName || 'Comune'}.`);
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
              <MappaSelezionePosizione
                location={location}
                locationDetails={locationDetails}
                isGeocoding={isGeocoding}
                onLocationSelect={handleLocationSelect}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <ModuloDatiAnimale
                formData={formData}
                setFormData={setFormData}
                isAltroSelected={isAltroSelected}
                setIsAltroSelected={setIsAltroSelected}
                managedAnimalQuery={managedAnimalQuery}
                setManagedAnimalQuery={setManagedAnimalQuery}
                animaliGestiti={ANIMALI_GESTITI}
                photo={photo}
                setPhoto={setPhoto}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <ModuloDatiSegnalante
                formData={formData}
                setFormData={setFormData}
                autoRecoverStatus={autoRecoverStatus}
                isPrivacyModalOpen={isPrivacyModalOpen}
                setIsPrivacyModalOpen={setIsPrivacyModalOpen}
                privacyText={privacyText}
                defaultPrivacyText={DEFAULT_PRIVACY_TEXT}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <RiepilogoInvio
                formData={formData}
                location={location}
                locationDetails={locationDetails}
                photo={photo}
                loading={loading}
                siteName={siteName}
                onBack={() => setStep(3)}
                onSubmit={handleSubmit}
                generateSegnalazionePDF={() => generateSegnalazionePDF()}
              />
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
