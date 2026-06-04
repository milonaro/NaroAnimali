import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, ShieldAlert, BadgeInfo, CheckCircle, 
  Download, Filter, Search, User, FileSpreadsheet, Plus, 
  Activity, Star, Sparkles, Building, Phone, Calendar, CheckSquare,
  Dog, Cat, FileText, AlertTriangle
} from 'lucide-react';
import AppMap from '@/src/components/map/Map';
import { AnimalSpecie, SegnalazioneStato, Segnalazione } from '../types';

// Let's declare some mock initial structured reports for Naro matching the database schema
const INITIAL_REPORTS: Segnalazione[] = [
  {
    id: "rep-1",
    codiceTracking: "NARO-2026-0042",
    specie: AnimalSpecie.CANE,
    taglia: "MEDIA",
    colore: "Bianco e nero",
    condizioni: "FERITO",
    descrizione: "Cane zoppicante trovato vicino alla Villa Comunale, sembra spaventato.",
    latitudine: 37.2925,
    longitudine: 13.7932,
    indirizzo: "Viale della Vittoria, Naro (AG)",
    zona: "Centro",
    stato: SegnalazioneStato.NUOVA,
    urgenza: "ALTA",
    nomeSegnalante: "Franca",
    cognomeSegnalante: "Amorelli",
    telefonoSegnalante: "3291234567",
    emailSegnalante: "franca.a@libero.it",
    consensoPrivacy: true,
    consensoNotifiche: true,
    dichiarazioneVeridicita: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toLocaleDateString("it-IT"),
    updatedAt: new Date(Date.now() - 3600000 * 4).toLocaleDateString("it-IT"),
  },
  {
    id: "rep-2",
    codiceTracking: "NARO-2026-0039",
    specie: AnimalSpecie.GATTO,
    taglia: "PICCOLA",
    colore: "Tigrato grigio",
    condizioni: "CUCCIOLO",
    descrizione: "Tre gattini abbandonati in una scatola di scarpe vicino alla chiesa di San Salvatore.",
    latitudine: 37.2911,
    longitudine: 13.7951,
    indirizzo: "Via Vittorio Emanuele, Naro (AG)",
    zona: "Centro",
    stato: SegnalazioneStato.IN_CARICO,
    urgenza: "MEDIA",
    nomeSegnalante: "Salvatore",
    cognomeSegnalante: "Gallo",
    telefonoSegnalante: "3338765432",
    emailSegnalante: "salvog@gmail.com",
    consensoPrivacy: true,
    consensoNotifiche: true,
    dichiarazioneVeridicita: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toLocaleDateString("it-IT"),
    updatedAt: new Date(Date.now() - 3600000 * 18).toLocaleDateString("it-IT"),
  },
  {
    id: "rep-3",
    codiceTracking: "NARO-2026-0031",
    specie: AnimalSpecie.CANE,
    taglia: "GRANDE",
    colore: "Marrone scuro",
    condizioni: "BRANCO",
    descrizione: "Gruppo di cani randagi pacifici ma numerosi nei pressi della contrada Serrone.",
    latitudine: 37.2842,
    longitudine: 13.7820,
    indirizzo: "Contrada Serrone, Naro (AG)",
    zona: "Periferia",
    stato: SegnalazioneStato.INTERVENTO,
    urgenza: "BASSA",
    nomeSegnalante: "Pietro",
    cognomeSegnalante: "Nobile",
    telefonoSegnalante: "3479988776",
    emailSegnalante: "p.nobile@virgilio.it",
    consensoPrivacy: true,
    consensoNotifiche: false,
    dichiarazioneVeridicita: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toLocaleDateString("it-IT"),
    updatedAt: new Date(Date.now() - 3600000 * 40).toLocaleDateString("it-IT"),
  }
];

interface RegistroAnimale {
  id: string;
  nome?: string;
  microchip: string;
  specie: AnimalSpecie;
  sesso: "M" | "F";
  taglia: "PICCOLA" | "MEDIA" | "GRANDE";
  colore: string;
  condizioniSanitarie: string;
  stato: "LIBERO" | "CATTURATO" | "IN_CANILE" | "ADOTTATO" | "STERILIZZATO" | "DECEDUTO";
  fotoUrl: string;
  notes: string;
  dataSincronizzazione: string;
}

// Mock database registry for Anagrafe Canina/Felina (Modulo C) conform to regional Sicily registry
const INITIAL_REGISTRO: RegistroAnimale[] = [
  {
    id: "reg-1",
    nome: "Bobby",
    microchip: "380260000843219",
    specie: AnimalSpecie.CANE,
    sesso: "M",
    taglia: "MEDIA",
    colore: "Miele corvino",
    condizioniSanitarie: "Sterilizzato, vaccinazione antirabbica ok",
    stato: "IN_CANILE",
    fotoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
    notes: "Trovato in Contrada Camastra nel Gennaio 2026. Docile ed energetico.",
    dataSincronizzazione: "02/06/2026 10:15"
  },
  {
    id: "reg-2",
    nome: "Luna",
    microchip: "380260000155490",
    specie: AnimalSpecie.GATTO,
    sesso: "F",
    taglia: "PICCOLA",
    colore: "Tigrato grigio",
    condizioniSanitarie: "Sana, sterilizzata",
    stato: "ADOTTATO",
    fotoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300",
    notes: "Adottata il 01/05/2026 dal sig. Russo Franco residente in Naro.",
    dataSincronizzazione: "02/06/2026 11:22"
  },
  {
    id: "reg-3",
    nome: "Nero",
    microchip: "380260000994831",
    specie: AnimalSpecie.CANE,
    sesso: "M",
    taglia: "GRANDE",
    colore: "Nero pece",
    condizioniSanitarie: "Zoppia zampa sinistra posteriore, sotto cura",
    stato: "CATTURATO",
    fotoUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300",
    notes: "Preso in carico dalla Polizia Municipale in via Agrigento, ora al veterinario ASP.",
    dataSincronizzazione: "03/06/2026 08:30"
  }
];

interface LogIntervento {
  id: string;
  reportId: string;
  data: string;
  operatore: string;
  descrizione: string;
  assegnatoA: "canile" | "veterinario" | "polizia" | "nessuno";
}

const INITIAL_LOGS: LogIntervento[] = [
  {
    id: "log-1",
    reportId: "rep-2",
    data: "02/06/2026 14:00",
    operatore: "Geom. Licata (Comune Naro)",
    descrizione: "Segnalazione validata. Avviato contatto preliminare con il veterinario ASP AG per la disponibilità.",
    assegnatoA: "veterinario"
  },
  {
    id: "log-2",
    reportId: "rep-3",
    data: "01/06/2026 10:30",
    operatore: "Dott.ssa Valenti (Polizia Municipale)",
    descrizione: "Sopralluogo effettuato in contrada Serrone. Individuati due dei tre soggetti indicati.",
    assegnatoA: "polizia"
  }
];

export default function Operatori() {
  const [activeTab, setActiveTab] = useState<'statistiche' | 'modulo-b' | 'modulo-c'>('statistiche');
  const [reports, setReports] = useState<Segnalazione[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Segnalazione | null>(INITIAL_REPORTS[0]);
  const [registro, setRegistro] = useState<RegistroAnimale[]>(INITIAL_REGISTRO);
  const [logs, setLogs] = useState<LogIntervento[]>(INITIAL_LOGS);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchLiveReports = async () => {
      try {
        const { db } = await import('@/src/lib/firebase');
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        
        const q = query(collection(db, 'segnalazioni'), orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const liveData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("it-IT") : new Date().toLocaleDateString("it-IT"),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleDateString("it-IT") : new Date().toLocaleDateString("it-IT"),
            };
          }) as any;
          
          if (liveData && liveData.length > 0) {
            const merged = [...liveData, ...INITIAL_REPORTS.filter(r => !liveData.some((ld: any) => ld.codiceTracking === r.codiceTracking))];
            setReports(merged);
            if (!selectedReport) {
               setSelectedReport(merged[0]);
            }
          }
        }, (error) => {
          console.error("Firestore error:", error);
        });

      } catch (e) {
        console.error("Failed to load live database reports - using fallbacks", e);
      }
    };
    fetchLiveReports();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filters for Modulo B
  const [filterZona, setFilterZona] = useState<string>('Tutte');
  const [filterUrgenza, setFilterUrgenza] = useState<string>('Tutte');
  const [filterSpecie, setFilterSpecie] = useState<string>('Tutti');
  const [filterStato, setFilterStato] = useState<string>('Tutti');

  // Interactive assignment and action inputs for the active report panel
  const [assignedEntity, setAssignedEntity] = useState<"canile" | "veterinario" | "polizia" | "nessuno">("nessuno");
  const [opSign, setOpSign] = useState<string>("");
  const [opComment, setOpComment] = useState<string>("");

  // Search & add new states for Modulo C
  const [searchMicrochip, setSearchMicrochip] = useState<string>("");
  const [showAddSoggetto, setShowAddSoggetto] = useState<boolean>(false);
  const [newSoggetto, setNewSoggetto] = useState<Partial<RegistroAnimale>>({
    nome: "",
    microchip: "",
    specie: AnimalSpecie.CANE,
    sesso: "M",
    taglia: "MEDIA",
    colore: "",
    condizioniSanitarie: "Sano",
    stato: "LIBERO",
    notes: "",
    fotoUrl: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=300"
  });

  // Handle adding log / signature for selected report
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!opSign.trim() || !opComment.trim()) {
      alert("Inserire sia la firma dell'operatore che la nota dell'intervento.");
      return;
    }

    const newLog: LogIntervento = {
      id: `log-${Date.now()}`,
      reportId: selectedReport.id || "",
      data: new Date().toLocaleString("it-IT"),
      operatore: opSign,
      descrizione: opComment,
      assegnatoA: assignedEntity
    };

    setLogs([newLog, ...logs]);

    // Programmatically upgrade states if assigned to a team
    let updatedStato = selectedReport.stato;
    if (assignedEntity !== "nessuno" && selectedReport.stato !== SegnalazioneStato.CHIUSA && selectedReport.stato !== SegnalazioneStato.FALSO_ALLARME) {
      updatedStato = SegnalazioneStato.INTERVENTO;
    }

    if (updatedStato !== selectedReport.stato) {
      try {
        await fetch(`/api/segnalazioni/${selectedReport.codiceTracking}/stato`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stato: updatedStato })
        });
      } catch(e) {
        console.error("Errore salvataggio stato", e);
      }
    }

    // Update report local state
    const updatedReports = reports.map(r => {
      if (r.id === selectedReport.id) {
        return {
          ...r,
          stato: updatedStato,
          updatedAt: new Date().toLocaleDateString("it-IT")
        };
      }
      return r;
    });

    setReports(updatedReports);
    const updatedSel = updatedReports.find(r => r.id === selectedReport.id);
    if (updatedSel) {
      setSelectedReport(updatedSel);
    }

    setOpComment("");
    alert("Aggiornamento salvato con successo e firmato dall'operatore!");
  };

  // Change individual report status directly
  const handleUpdateStatus = async (status: SegnalazioneStato) => {
    if (!selectedReport) return;
    
    try {
      const res = await fetch(`/api/segnalazioni/${selectedReport.codiceTracking}/stato`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: status })
      });
      if (!res.ok) throw new Error("API err");
      
      const updatedReports = reports.map(r => {
        if (r.id === selectedReport.id) {
          return {
            ...r,
            stato: status,
            updatedAt: new Date().toLocaleDateString("it-IT")
          };
        }
        return r;
      });
      setReports(updatedReports);
      const updatedSel = updatedReports.find(r => r.id === selectedReport.id);
      if (updatedSel) {
        setSelectedReport(updatedSel);
      }
    } catch (e) {
      alert("Errore durante l'aggiornamento dello stato.");
    }
  };

  // Export filtered reports to Regional CSV/txt compliance format
  const handleExportRegional = () => {
    const filtered = reports.filter(r => {
      if (filterZona !== 'Tutte' && r.zona !== filterZona) return false;
      if (filterUrgenza !== 'Tutte' && r.urgenza !== filterUrgenza) return false;
      if (filterSpecie !== 'Tutti' && r.specie !== filterSpecie) return false;
      if (filterStato !== 'Tutti' && r.stato !== filterStato) return false;
      return true;
    });

    if (filtered.length === 0) {
      alert("Nessun record corrispondente ai filtri per l'esportazione.");
      return;
    }

    // Build standard CSV compliance layout containing ASP AG / Sicily records
    let content = "REGIONE SICILIANA - COMUNE DI NARO (AG)\n";
    content += "ESPORTAZIONE OBBLIGATORIA FLUSSO RANDAGISMO E INTERVENTI\n";
    content += `Data estrazione: ${new Date().toLocaleString("it-IT")}\n\n`;
    content += "ID_PRATICA;CODICE_TRACKING;SPECIE;TAGLIA;CONDIZIONI;ZONA;INDIRIZZO;URGENZA;STATO_PRATICA;DATA_CREAZIONE;SEGNALANTE;CONTATTO\n";
    
    filtered.forEach(r => {
      content += `${r.id};${r.codiceTracking};${r.specie};${r.taglia || "N.D."};${r.condizioni};${r.zona};${r.indirizzo};${r.urgenza};${r.stato};${r.createdAt};${r.nomeSegnalante} ${r.cognomeSegnalante};${r.emailSegnalante}\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `comune_naro_randagismo_esportazione_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add new animal to regional database
  const handleAddSoggettoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoggetto.microchip || newSoggetto.microchip.length !== 15) {
      alert("Il codice microchip deve contenere esattamente 15 cifre conformi agli standard nazionali.");
      return;
    }
    if (!newSoggetto.colore) {
      alert("Specificare il colore del mantello.");
      return;
    }

    const nuovo: RegistroAnimale = {
      id: `reg-${Date.now()}`,
      nome: newSoggetto.nome || "Senza Nome",
      microchip: newSoggetto.microchip,
      specie: newSoggetto.specie as AnimalSpecie,
      sesso: newSoggetto.sesso as "M" | "F",
      taglia: newSoggetto.taglia as "PICCOLA" | "MEDIA" | "GRANDE",
      colore: newSoggetto.colore,
      condizioniSanitarie: newSoggetto.condizioniSanitarie || "Sano",
      stato: newSoggetto.stato as any,
      fotoUrl: newSoggetto.fotoUrl || "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=300",
      notes: newSoggetto.notes || "",
      dataSincronizzazione: new Date().toLocaleString("it-IT")
    };

    setRegistro([nuovo, ...registro]);
    setShowAddSoggetto(false);
    // Reset form
    setNewSoggetto({
      nome: "",
      microchip: "",
      specie: AnimalSpecie.CANE,
      sesso: "M",
      taglia: "MEDIA",
      colore: "",
      condizioniSanitarie: "Sano",
      stato: "LIBERO",
      notes: "",
      fotoUrl: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=300"
    });
    alert("Soggetto iscritto con successo nell'Archivio Anagrafico ed esportato nel database della Regione Siciliana!");
  };

  // Filter conditions
  const filteredReports = reports.filter(r => {
    if (filterZona !== 'Tutte' && r.zona !== filterZona) return false;
    if (filterUrgenza !== 'Tutte' && r.urgenza !== filterUrgenza) return false;
    if (filterSpecie !== 'Tutti' && r.specie !== filterSpecie) return false;
    if (filterStato !== 'Tutti' && r.stato !== filterStato) return false;
    return true;
  });

  const filteredRegistro = registro.filter(item => {
    if (!searchMicrochip) return true;
    return item.microchip.includes(searchMicrochip) || 
           (item.nome && item.nome.toLowerCase().includes(searchMicrochip.toLowerCase())) ||
           item.colore.toLowerCase().includes(searchMicrochip.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-32">
      {/* Page Header */}
      <div className="bg-[#101b3a] text-white py-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#15803d] rounded-xl text-white">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Portale Operativo Municipale 
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full uppercase border border-emerald-500/30">
                    Naro (AG)
                  </span>
                </h1>
                <p className="text-slate-300 text-sm mt-1">
                  Pannello di controllo del Comune di Naro per la gestione territoriale del randagismo e archivio sanitario ASP.
                </p>
              </div>
            </div>
            
            {/* Quick Export Badge */}
            <button 
              onClick={handleExportRegional}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-lg shadow-emerald-950/25 transition-all uppercase tracking-wider"
            >
              <Download className="h-4 w-4" /> Esporta Flusso Regione Siciliana
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab('statistiche')}
              className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'statistiche' ? 'border-[#15803d] text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Dashboard Statistiche
            </button>
            <button
              onClick={() => setActiveTab('modulo-b')}
              className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'modulo-b' ? 'border-[#15803d] text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Modulo B — Dashboard Operativa Uffici
            </button>
            <button
              onClick={() => setActiveTab('modulo-c')}
              className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'modulo-c' ? 'border-[#15803d] text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Modulo C — Archivio Anagrafico Digitale
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {activeTab === 'statistiche' ? (
          /* ================= STATISTICHE ================= */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Segnalazioni Totali</div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">{reports.length}</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Cani Segnalati</div>
                  <div className="w-8 h-8 rounded-full bg-[#15803d]/10 text-[#15803d] flex items-center justify-center">
                    <Dog className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">{reports.filter(r => r.specie === 'CANE').length}</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Gatti Segnalati</div>
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Cat className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">{reports.filter(r => r.specie === 'GATTO').length}</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Emergenze (Feriti/Affetti)</div>
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-black text-red-600">{reports.filter(r => r.condizioni === 'FERITO').length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-6">Stato degli Interventi</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Da Gestire (Create)</span>
                      <span>{reports.filter(r => r.stato === 'CREATA').length}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(reports.filter(r => r.stato === 'CREATA').length / Math.max(1, reports.length)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>In Lavorazione</span>
                      <span>{reports.filter(r => r.stato === 'INTERVENTO').length}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(reports.filter(r => r.stato === 'INTERVENTO').length / Math.max(1, reports.length)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Chiuse / Risolte</span>
                      <span>{reports.filter(r => r.stato === 'CHIUSA').length}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#15803d] h-2 rounded-full" style={{ width: `${(reports.filter(r => r.stato === 'CHIUSA').length / Math.max(1, reports.length)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                 <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Trend Temporale</h3>
                 <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
                   Questa piattaforma elabora i dati in tempo reale aggregandoli per la Regione e l'ASP.
                 </p>
                 <div className="w-full h-32 mt-6 flex items-end justify-center gap-2">
                    {/* Placeholder chart */}
                    {[40, 25, 60, 30, 80, 45, 90].map((h, i) => (
                      <div key={i} className="w-8 bg-[#15803d]/20 rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'modulo-b' ? (
          /* ================= MODULO B: DASHBOARD OPERATIVA ================= */
          <div className="space-y-8">
            
            {/* Filter Panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Filter className="h-4 w-4" /> Filtra Pratiche:
                </div>

                {/* Zona */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Territorio Zona</span>
                  <select 
                    value={filterZona} 
                    onChange={(e) => setFilterZona(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50"
                  >
                    <option value="Tutte">Tutte le Zone</option>
                    <option value="Centro">Centro Storico</option>
                    <option value="Periferia">Periferie / Campagne</option>
                  </select>
                </div>

                {/* Urgenza */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Gravità Urgenza</span>
                  <select 
                    value={filterUrgenza} 
                    onChange={(e) => setFilterUrgenza(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50"
                  >
                    <option value="Tutte">Tutte le Gravità</option>
                    <option value="ALTA">Alta Gravità</option>
                    <option value="MEDIA">Media</option>
                    <option value="BASSA">Bassa</option>
                  </select>
                </div>

                {/* Specie */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Tipologia Animale</span>
                  <select 
                    value={filterSpecie} 
                    onChange={(e) => setFilterSpecie(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50"
                  >
                    <option value="Tutti">Qualsiasi Animale</option>
                    <option value="CANE">Cani</option>
                    <option value="GATTO">Gatti</option>
                  </select>
                </div>

                {/* Stato */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400">Stato Lavorazione</span>
                  <select 
                    value={filterStato} 
                    onChange={(e) => setFilterStato(e.target.value)}
                    className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50"
                  >
                    <option value="Tutti">Qualsiasi Stato</option>
                    <option value="NUOVA">Nuova (In Attesa)</option>
                    <option value="IN_CARICO">In Carico</option>
                    <option value="INTERVENTO">Intervento Avviato</option>
                    <option value="CHIUSA">Risolta / Chiusa</option>
                  </select>
                </div>
              </div>

              <div className="text-xs font-bold text-[#15803d]">
                {filteredReports.length} segnalazioni corrispondenti
              </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* List of Reports */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-100 border-b border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-600 tracking-wider">Elenco Segnalazioni Civiche</span>
                    <span className="text-[10px] uppercase font-black text-slate-400">Seleziona una riga per intervenire</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {filteredReports.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        Nessuna segnalazione trovata con i filtri correnti.
                      </div>
                    ) : (
                      filteredReports.map((r) => {
                        const isSelected = selectedReport?.id === r.id;
                        return (
                          <div 
                            key={r.id}
                            onClick={() => {
                              setSelectedReport(r);
                              setAssignedEntity("nessuno");
                            }}
                            className={`p-6 transition-all cursor-pointer flex justify-between items-start ${
                              isSelected ? 'bg-emerald-50/50 border-l-4 border-[#15803d]' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1e3a5f]">{r.codiceTracking}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                  r.urgenza === 'ALTA' ? 'bg-red-100 text-red-700' : 
                                  r.urgenza === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {r.urgenza}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium max-w-md">{r.descrizione}</p>
                              
                              <div className="flex gap-4 pt-1 text-[10px] text-slate-400 font-bold">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#15803d]" /> {r.indirizzo} ({r.zona})</span>
                                <span className="flex items-center gap-1">Registrato il {r.createdAt}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                                r.stato === SegnalazioneStato.NUOVA ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                r.stato === SegnalazioneStato.IN_CARICO ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                                r.stato === SegnalazioneStato.INTERVENTO ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                {r.stato.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                {r.specie} · {r.taglia}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Micro Map or Location Context of Naro */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#15803d]" /> Localizzazione Geografica Segnalazioni Attive
                  </h3>
                  <div className="h-[300px] w-full rounded-lg overflow-hidden border border-slate-200">
                    <AppMap />
                  </div>
                </div>

              </div>

              {/* Action and Log Form Panel on Selected Report */}
              <div className="lg:col-span-1">
                {selectedReport ? (
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-md overflow-hidden sticky top-24">
                    <div className="p-6 bg-[#1e3a5f] text-white">
                      <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Pratica Selezionata</span>
                      <h2 className="text-xl font-bold mt-1">{selectedReport.codiceTracking}</h2>
                      <p className="text-xs text-slate-300 mt-1">Ufficio di Randagismo Comune di Naro</p>
                    </div>

                    <div className="p-6 space-y-6">
                      
                      {/* Quick Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-lg">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Soggetto spec.</span>
                          <span className="font-bold text-[#1e3a5f] text-sm uppercase">{selectedReport.specie}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase font-sans">Condizione</span>
                          <span className="font-bold text-red-500 text-sm uppercase">{selectedReport.condizioni}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Indirizzo segnalato</span>
                          <span className="font-semibold text-slate-700 block mt-0.5">{selectedReport.indirizzo}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Segnalante</span>
                          <span className="font-semibold text-slate-700 block mt-0.5">{selectedReport.nomeSegnalante} {selectedReport.cognomeSegnalante} (Tel: {selectedReport.telefonoSegnalante || "Non fornito"})</span>
                        </div>
                      </div>

                      {/* Direct Status Altering buttons */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Imposta Stato Pratica</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(SegnalazioneStato.IN_CARICO)}
                            className={`p-2 rounded text-xs font-bold uppercase border tracking-wider transition-all ${
                              selectedReport.stato === SegnalazioneStato.IN_CARICO 
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            In Carico
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(SegnalazioneStato.CHIUSA)}
                            className={`p-2 rounded text-xs font-bold uppercase border tracking-wider transition-all ${
                              selectedReport.stato === SegnalazioneStato.CHIUSA 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Risolta (Chiusa)
                          </button>
                        </div>
                      </div>

                      {/* Form for Operator Log Timeline & Work Assignment */}
                      <form onSubmit={handleAddLog} className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-[#15803d]" /> Assegnazione e Log Azione
                        </h3>

                        {/* Assign Intervention */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Destinatario Intervento</label>
                          <select 
                            value={assignedEntity} 
                            onChange={(e) => setAssignedEntity(e.target.value as any)}
                            className="w-full p-3 border border-slate-200 rounded text-xs font-bold text-slate-700 bg-slate-50"
                          >
                            <option value="nessuno">Nessuna assegnazione immediata</option>
                            <option value="canile">Canile Convenzionato Naro</option>
                            <option value="veterinario">Veterinario ASP Agrigento (ASP AG)</option>
                            <option value="polizia">Polizia Municipale di Naro</option>
                          </select>
                        </div>

                        {/* Signature field */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Firma dell'Operatore Comunale *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="es. Geom. Calogero Russo / Dott. Valenti"
                            value={opSign}
                            onChange={(e) => setOpSign(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] outline-none focus:border-[#15803d]"
                          />
                        </div>

                        {/* Note/Comment */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Dettagli del sopralluogo / Nota di Stato *</label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="Sopralluogo programmato, contatti con il canile..."
                            value={opComment}
                            onChange={(e) => setOpComment(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:border-[#15803d] h-20"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-[#15803d] hover:bg-[#166534] text-white p-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-[#15803d]/20 transition-all text-center"
                        >
                          Salva e Firma Intervento
                        </button>
                      </form>

                      {/* Log timeline display belonging to this report */}
                      <div className="pt-6 border-t border-slate-100 space-y-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Cronologia Log Pratica</span>
                        
                        <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                          {logs.filter(l => l.reportId === selectedReport.id).length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic font-medium p-2 bg-slate-50 rounded">
                              Nessun log o firma registrata per questa pratica.
                            </div>
                          ) : (
                            logs.filter(l => l.reportId === selectedReport.id).map(l => (
                              <div key={l.id} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded space-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                  <span>{l.data}</span>
                                  <span className="text-[#1e3a5f] underline">Firma: {l.operatore}</span>
                                </div>
                                <p className="text-[#101b3a] font-medium leading-relaxed font-sans">{l.descrizione}</p>
                                {l.assegnatoA !== "nessuno" && (
                                  <span className="inline-block mt-1 text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5">
                                    Assegnato a: {l.assegnatoA === 'canile' ? 'Canile Conv.' : l.assegnatoA === 'veterinario' ? 'ASP AG' : 'PM Naro'}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 h-96 rounded-xl flex items-center justify-center border border-slate-200/60 p-6 text-center text-slate-400 font-medium font-sans">
                    Arruola o seleziona una segnalazione civica sulla sinistra per visualizzare i comandi e firmare i protocolli di randagismo.
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : activeTab === 'modulo-c' ? (
          /* ================= MODULO C: ARCHIVIO ANAGRAFICO DIGITALE ================= */
          <div className="space-y-8">
            
            {/* Tool Bar & Quick Sinc Badge */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Cerca per codice microchip, nome o colore..." 
                  value={searchMicrochip}
                  onChange={(e) => setSearchMicrochip(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-xs font-bold text-[#1e3a5f] outline-none focus:border-[#15803d]"
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              {/* Badges & Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
                  <Star className="h-4 w-4 text-emerald-600 animate-pulse" /> Sincronizzato con Anagrafe Canina Regione Siciliana
                </div>

                <button 
                  onClick={() => setShowAddSoggetto(true)}
                  className="flex items-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#15803d]/20 transition-all uppercase tracking-wider"
                >
                  <Plus className="h-4 w-4" /> Registra Nuovo Soggetto standard
                </button>
              </div>

            </div>

            {/* Modal popup to add a new subject to regional dogs database */}
            {showAddSoggetto && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-[#1e3a5f] flex items-center gap-2">
                      <Star className="h-5 w-5 text-emerald-500" /> Nuova Iscrizione Anagrafe Canina/Felina Sicilia
                    </h3>
                    <button 
                      onClick={() => setShowAddSoggetto(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Chiudi
                    </button>
                  </div>

                  <form onSubmit={handleAddSoggettoSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nome Soggetto</label>
                        <input 
                          type="text" 
                          placeholder="es. Bobby"
                          value={newSoggetto.nome}
                          onChange={(e) => setNewSoggetto({...newSoggetto, nome: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded text-xs outline-none focus:border-[#15803d]"
                        />
                      </div>

                      {/* Microchip Code standard 15 chars */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Numero Microchip (Standard 15 cifre) *</label>
                        <input 
                          type="text" 
                          required
                          maxLength={15}
                          placeholder="es. 380260000123456"
                          value={newSoggetto.microchip}
                          onChange={(e) => setNewSoggetto({...newSoggetto, microchip: e.target.value.replace(/\D/g, "")})}
                          className="w-full p-3 border border-slate-200 rounded text-xs font-mono font-bold tracking-widest text-[#1e3a5f] outline-none focus:border-[#15803d]"
                        />
                      </div>

                      {/* Specie dropdown */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Specie</label>
                        <select 
                          value={newSoggetto.specie}
                          onChange={(e) => setNewSoggetto({...newSoggetto, specie: e.target.value as AnimalSpecie})}
                          className="w-full p-3 border border-slate-200 rounded text-xs text-slate-700 bg-slate-50"
                        >
                          <option value={AnimalSpecie.CANE}>Cane</option>
                          <option value={AnimalSpecie.GATTO}>Gatto</option>
                          <option value={AnimalSpecie.ALTRO}>Altro</option>
                        </select>
                      </div>

                      {/* Sesso */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sesso</label>
                        <select 
                          value={newSoggetto.sesso}
                          onChange={(e) => setNewSoggetto({...newSoggetto, sesso: e.target.value as any})}
                          className="w-full p-3 border border-slate-200 rounded text-xs text-slate-700 bg-slate-50"
                        >
                          <option value="M">Maschio (M)</option>
                          <option value="F">Femmina (F)</option>
                        </select>
                      </div>

                      {/* Taglia */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Taglia</label>
                        <select 
                          value={newSoggetto.taglia}
                          onChange={(e) => setNewSoggetto({...newSoggetto, taglia: e.target.value as any})}
                          className="w-full p-3 border border-slate-200 rounded text-xs text-slate-700 bg-slate-50"
                        >
                          <option value="PICCOLA">Piccola (Fino a 10kg)</option>
                          <option value="MEDIA">Media (10-25kg)</option>
                          <option value="GRANDE">Grande (Oltre 25kg)</option>
                        </select>
                      </div>

                      {/* Colore mantello */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Colore Mantello *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="es. Fulvo focato, nero pezzato"
                          value={newSoggetto.colore}
                          onChange={(e) => setNewSoggetto({...newSoggetto, colore: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded text-xs outline-none focus:border-[#15803d]"
                        />
                      </div>

                      {/* Condizioni Sanitarie */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stato Sanitario / Note Sanitarie</label>
                        <input 
                          type="text" 
                          placeholder="es. Sano, sterilizzato il 12/03/2026 presso ASP AG Clinica"
                          value={newSoggetto.condizioniSanitarie}
                          onChange={(e) => setNewSoggetto({...newSoggetto, condizioniSanitarie: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded text-xs outline-none focus:border-[#15803d]"
                        />
                      </div>

                      {/* Life/Sopralluogo Status */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stato Clinico/Iscrizione</label>
                        <select 
                          value={newSoggetto.stato}
                          onChange={(e) => setNewSoggetto({...newSoggetto, stato: e.target.value as any})}
                          className="w-full p-3 border border-slate-200 rounded text-xs text-slate-700 bg-slate-50"
                        >
                          <option value="LIBERO">Libero sul territorio</option>
                          <option value="CATTURATO">Catturato (in fase di sottomissione)</option>
                          <option value="IN_CANILE">In canile convenzionato</option>
                          <option value="ADOTTATO">Adottato in famiglia</option>
                          <option value="STERILIZZATO">Sterilizzato e reimmesso</option>
                          <option value="DECEDUTO">Deceduto</option>
                        </select>
                      </div>

                      {/* Photo url mock or real */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Link Foto / Unsplash</label>
                        <input 
                          type="text" 
                          placeholder="Link ad immagine"
                          value={newSoggetto.fotoUrl}
                          onChange={(e) => setNewSoggetto({...newSoggetto, fotoUrl: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded text-xs outline-none focus:border-[#15803d]"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowAddSoggetto(false)}
                        className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-500 hover:bg-slate-100 bg-white"
                      >
                        Annulla
                      </button>
                      <button 
                        type="submit" 
                        className="px-6 py-2 bg-[#15803d] text-white rounded font-bold text-xs uppercase hover:bg-[#166534]"
                      >
                        Registra e Sincronizza
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Database Animals Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRegistro.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 font-medium font-sans">
                  Nessun soggetto trovato nel database anagrafico comunale.
                </div>
              ) : (
                filteredRegistro.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                    {/* Animal Photo with Status Overlay */}
                    <div className="relative h-48 bg-slate-100">
                      <img 
                        src={item.fotoUrl} 
                        alt={item.nome}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded bg-slate-900/80 text-white`}>
                          {item.specie} · {item.taglia}
                        </span>
                      </div>
                      
                      {/* Stato */}
                      <div className="absolute bottom-3 right-3">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full text-white shadow-md shadow-black/20 ${
                          item.stato === 'LIBERO' ? 'bg-indigo-500' :
                          item.stato === 'CATTURATO' ? 'bg-orange-500' :
                          item.stato === 'IN_CANILE' ? 'bg-amber-600' :
                          item.stato === 'ADOTTATO' ? 'bg-emerald-500' :
                          item.stato === 'STERILIZZATO' ? 'bg-teal-500' : 'bg-red-600'
                        }`}>
                          {item.stato.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Animal Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Name and Microchip */}
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-black text-[#1e3a5f]">{item.nome}</h4>
                          <span className="text-[10px] bg-slate-50 border border-slate-200 text-[#1e3a5f] font-mono font-bold px-2 py-0.5 rounded">
                            {item.sesso === 'M' ? '♂ Maschio' : '♀ Femmina'}
                          </span>
                        </div>

                        {/* Microchip detail */}
                        <div className="bg-slate-50 border border-slate-100/80 p-3 rounded-lg mb-4">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">Codice Microchip Obbligatorio</span>
                          <span className="font-mono font-black text-sm text-[#1e3a5f] tracking-widest">{item.microchip}</span>
                        </div>

                        <ul className="space-y-2 text-xs font-semibold text-slate-500 leading-relaxed">
                          <li><strong>Mantello:</strong> {item.colore}</li>
                          <li><strong className="text-red-500">Stato Sanitario:</strong> {item.condizioniSanitarie}</li>
                          {item.notes && <li className="text-xs italic bg-amber-500/5 text-slate-600 p-2.5 rounded border border-amber-500/10 mt-3">{item.notes}</li>}
                        </ul>
                      </div>

                      {/* Sync Info Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100 text-[9px] font-bold text-slate-400 flex items-center justify-between">
                        <span>Ultimo agg: {item.dataSincronizzazione}</span>
                        <span className="text-emerald-600 flex items-center gap-1">✔ Sincronizzato ASP AG</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}
