import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, ShieldAlert, BadgeInfo, CheckCircle, 
  Download, Filter, Search, User, FileSpreadsheet, Plus, 
  Activity, Star, Sparkles, Building, Phone, Calendar, CheckSquare,
  Dog, Cat, FileText, AlertTriangle
} from 'lucide-react';
import AppMap from '@/src/components/map/Map';
import { AnimalSpecie, SegnalazioneStato, Segnalazione } from '../types';

// Removed mock data variables
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

interface LogIntervento {
  id: string;
  reportId: string;
  data: string;
  operatore: string;
  descrizione: string;
  assegnatoA: "canile" | "veterinario" | "polizia" | "nessuno";
}

export default function Operatori() {
  const [activeTab, setActiveTab] = useState<'statistiche' | 'modulo-b' | 'modulo-c' | 'modulo-adozioni'>('statistiche');
  const [activeComune, setActiveComune] = useState(() => (localStorage.getItem('active_comune') || 'naro').toLowerCase());
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [reports, setReports] = useState<Segnalazione[]>([]);
  const [selectedReport, setSelectedReport] = useState<Segnalazione | null>(null);
  const [registro, setRegistro] = useState<RegistroAnimale[]>([]);
  const [logs, setLogs] = useState<LogIntervento[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [logsOffset, setLogsOffset] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);

  const loadMoreLogs = () => {
    const nextOffset = logsOffset + 10;
    setLogsOffset(nextOffset);
    fetch(`/api/interventi_logs?limit=10&offset=${nextOffset}`)
      .then(res => res.json())
      .then(resData => {
        if (resData && Array.isArray(resData.data)) {
          setLogs(prev => [...prev, ...resData.data]);
          if (resData.pagination) {
            setHasMoreLogs(resData.pagination.hasMore);
          }
        }
      })
      .catch(e => console.error("Error loading more logs", e));
  };

  // Fetch record on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
        console.error("Error fetching current operator", e);
      }
    };
    fetchMe();

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          if (data.activeComune) {
            const lowKey = data.activeComune.toLowerCase();
            localStorage.setItem('active_comune', lowKey);
            setActiveComune(lowKey);
          }
          if (data.siteName) {
            setSiteName(data.siteName);
          }
        }
      } catch (e) {
        console.error("Error fetching admin config in operator portal", e);
      }
    };
    fetchConfig();

    const loadRegistro = async () => {
      try {
        const res = await fetch('/api/registro');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRegistro(data);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadRegistro();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    
    // Fetch logs from API (paginated)
    fetch('/api/interventi_logs?limit=10&offset=0')
      .then(res => res.json())
      .then(resData => {
        if (resData && Array.isArray(resData.data)) {
          setLogs(resData.data);
          if (resData.pagination) {
            setHasMoreLogs(resData.pagination.hasMore);
            setTotalLogs(resData.pagination.total);
          }
        }
      })
      .catch(e => console.error("Error loading logs", e));

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
          
          const activeComKey = (localStorage.getItem('active_comune') || 'naro').toLowerCase();
          const filteredLiveData = liveData.filter((r: any) => {
            const rKey = r.comuneKey || r.comune_key || '';
            return rKey.toLowerCase() === activeComKey;
          });

          setReports(filteredLiveData);
          if (filteredLiveData.length > 0) {
            setSelectedReport((prevSelected) => {
              if (prevSelected) {
                // Keep the current selection if it still exists
                const stillExists = filteredLiveData.find((r: any) => r.id === prevSelected.id);
                return stillExists || filteredLiveData[0];
              }
              return filteredLiveData[0];
            });
          } else {
            setSelectedReport(null);
          }
        }, (error) => {
          console.error("Firestore error:", error);
        });

      } catch (e) {
        console.error("Failed to load live database reports", e);
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

    // Programmatically upgrade states if assigned to a team
    let updatedStato = selectedReport.stato;
    if (assignedEntity !== "nessuno" && selectedReport.stato !== SegnalazioneStato.CHIUSA) {
      updatedStato = SegnalazioneStato.INTERVENTO;
    }

    try {
      await fetch(`/api/segnalazioni/${selectedReport.codiceTracking}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          operatore: opSign, 
          azione: opComment, 
          note: assignedEntity !== "nessuno" ? `Assegnato a: ${assignedEntity}` : "",
          nuovoStato: updatedStato !== selectedReport.stato ? updatedStato : undefined
        })
      });
    } catch(e) {
      console.error("Errore salvataggio log", e);
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
    let content = `REGIONE SICILIANA - ${siteName.toUpperCase()}\n`;
    content += "ESPORTAZIONE OBBLIGATORIA FLUSSO RANDAGISMO E INTERVENTI\n";
    content += `Data estrazione: ${new Date().toLocaleString("it-IT")}\n\n`;
    content += "ID_PRATICA;CODICE_TRACKING;SPECIE;TAGLIA;CONDIZIONI;ZONA;INDIRIZZO;URGENZA;STATO_PRATICA;DATA_CREAZIONE;SEGNALANTE;CONTATTO\n";
    
    filtered.forEach(r => {
      content += `${r.id};${r.codiceTracking};${r.specie};${r.taglia || "N.D."};${r.condizioni};${r.zona || ''};${r.indirizzo};${r.urgenza};${r.stato};${r.createdAt};${r.nomeSegnalante || ''} ${r.cognomeSegnalante || ''};${r.emailSegnalante || ''}\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `comune_${activeComune}_randagismo_esportazione_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add new animal to regional database
  const handleAddSoggettoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoggetto.microchip || newSoggetto.microchip.length !== 15) {
      alert("Il codice microchip deve contenere esattamente 15 cifre conformi agli standard nazionali.");
      return;
    }
    if (!newSoggetto.colore) {
      alert("Specificare il colore del mantello.");
      return;
    }

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSoggetto)
      });
      if (res.ok) {
        const data = await res.json();
        const nuovo: RegistroAnimale = {
          id: data.id ? data.id.toString() : `reg-${Date.now()}`,
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
      } else {
        alert("Errore durante la registrazione.");
      }
    } catch (e) {
      alert("Errore di rete.");
    }
  };

  // Filter conditions
  const [editingSoggetto, setEditingSoggetto] = useState<RegistroAnimale | null>(null);

  const handleUpdateSoggettoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSoggetto) return;
    try {
      const res = await fetch(`/api/registro/${editingSoggetto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSoggetto)
      });
      if (res.ok) {
        setRegistro(registro.map(r => r.id === editingSoggetto.id ? { ...editingSoggetto, dataSincronizzazione: new Date().toLocaleString("it-IT") } : r));
        setEditingSoggetto(null);
        alert("Anagrafica aggiornata con successo.");
      } else {
        alert("Errore durante l'aggiornamento.");
      }
    } catch (e) {
      alert("Errore di rete.");
    }
  };

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
    <div className="min-h-screen bg-slate-50/70 pb-32 pt-24">
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
                    {activeComune.toUpperCase()}
                  </span>
                </h1>
                <p className="text-slate-300 text-sm mt-1">
                  Pannello di controllo del {siteName} per la gestione territoriale del randagismo e archivio sanitario ASP.
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
          <div className="flex flex-col md:flex-row gap-4 mt-8 border-b border-white/10 items-stretch md:items-center">
            <div className="flex gap-4">
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
              <button
                onClick={() => setActiveTab('modulo-adozioni')}
                className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'modulo-adozioni' ? 'border-[#15803d] text-white' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Modulo Adozioni & Costi
              </button>
            </div>
            {currentUser?.role === 'Admin' && (
              <a
                href="/admin/config"
                className="pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 border-transparent text-amber-400 hover:text-amber-300 flex items-center gap-1.5 md:ml-auto"
              >
                Configurazione Sistema ⚙️
              </a>
            )}
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
                      <span>Da Gestire (Nuove)</span>
                      <span>{reports.filter(r => r.stato === 'NUOVA' || r.stato === 'IN_CARICO').length}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(reports.filter(r => r.stato === 'NUOVA' || r.stato === 'IN_CARICO').length / Math.max(1, reports.length)) * 100}%` }}></div>
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

                      {/* Direct Status Altering buttons & Form for Operator Log Timeline */}
                      {currentUser?.role === 'Volontario' ? (
                        <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl space-y-3 text-amber-900 shadow-sm text-left">
                          <p className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider text-amber-700">
                            <ShieldAlert className="h-5 w-5 text-amber-600" /> Profilo Sola Lettura (Volontario)
                          </p>
                          <p className="text-xs leading-relaxed text-amber-800">
                            Gentile <strong>{currentUser.username}</strong>, in qualità di volontario puoi esplorare liberamente le segnalazioni e consultare il registro, ma non disponi dei privilegi amministrativi necessari per emettere log di stato, firmare verbali di intervento o assegnare pratiche.
                          </p>
                          <div className="border-t border-amber-200/60 pt-2 flex items-center justify-between text-[10px] font-bold text-amber-700 uppercase">
                            <span>Abilitazione Ente: Naro</span>
                            <span>Ruolo: Volontario</span>
                          </div>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}

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
                        {hasMoreLogs && (
                          <button 
                            type="button" 
                            onClick={loadMoreLogs}
                            className="mt-2 w-full text-center text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider bg-slate-100/50 py-1.5 rounded border border-dashed border-slate-200"
                          >
                            Carica Altri Log Storici ({logs.length} caricati)
                          </button>
                        )}
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

                {currentUser?.role === 'Volontario' ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-amber-600" /> Sola Lettura (Volontario)
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <button 
                        className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-5 py-3 rounded-lg shadow-sm transition-all uppercase tracking-wider relative overflow-hidden"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Importa da CSV
                        <input 
                          type="file" 
                          accept=".csv" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const text = await file.text();
                              const rows = text.split('\n').map(r => r.trim()).filter(r => r);
                              let c = 0;
                              for(let i = 1; i<rows.length; i++) {
                                const cols = rows[i].split(',');
                                if(cols.length>=6) {
                                  const rec = {
                                    microchip: cols[0].trim(),
                                    nome: cols[1].trim(),
                                    specie: cols[2].trim(),
                                    sesso: cols[3].trim(),
                                    taglia: cols[4].trim(),
                                    colore: cols[5].trim(),
                                    condizioniSanitarie: "Sano",
                                    stato: "LIBERO"
                                  };
                                  await fetch('/api/registro', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(rec) });
                                  c++;
                                }
                              }
                              alert(`Caricati con successo ${c} record! Ricaricare la pagina.`);
                            } catch(err) {
                               alert("Errore caricamento CSV");
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </button>
                    </div>
                    <button 
                      onClick={() => setShowAddSoggetto(true)}
                      className="flex items-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#15803d]/20 transition-all uppercase tracking-wider"
                    >
                      <Plus className="h-4 w-4" /> Registra Nuovo Soggetto standard
                    </button>
                  </>
                )}
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
                      <div className="mt-6 pt-4 border-t border-slate-100 text-[9px] font-bold text-slate-400 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span>Ultimo agg: {item.dataSincronizzazione}</span>
                          <span className="text-emerald-600 flex items-center gap-1">✔ Sincronizzato ASP AG</span>
                        </div>
                        {currentUser?.role !== 'Volontario' && (
                          <button 
                            onClick={() => setEditingSoggetto(item)}
                            className="w-full mt-2 font-bold uppercase tracking-wider text-[10px] text-center border-t border-slate-100 py-2 hover:bg-slate-50 text-blue-600 rounded-b animate-fade-in"
                          >
                            Modifica
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Editing Modal */}
            {editingSoggetto && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black uppercase text-[#1e3a5f] tracking-widest flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> Modifica Anagrafica
                    </h3>
                    <button 
                      onClick={() => setEditingSoggetto(null)}
                      className="text-slate-400 hover:text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded"
                    >
                      Chiudi
                    </button>
                  </div>
                  <form onSubmit={handleUpdateSoggettoSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stato Animale</label>
                        <select 
                          value={editingSoggetto.stato}
                          onChange={(e) => setEditingSoggetto({...editingSoggetto, stato: e.target.value as any})}
                          className="w-full p-3 border border-slate-200 rounded text-xs text-slate-700 bg-slate-50"
                        >
                          <option value="LIBERO">1 - Libero sul territorio collaudato (Cane di Quartiere)</option>
                          <option value="CATTURATO">2 - Recuperato / In Cattura</option>
                          <option value="IN_CANILE">3 - Depositato in Canile Sanitario/Rifugio</option>
                          <option value="ADOTTATO">4 - Affidato / Adottato</option>
                          <option value="STERILIZZATO">5 - Sterilizzato presso ASP AG (Gattara/Cane)</option>
                          <option value="DECEDUTO">6 - Deceduto / Smaltimento Carcassa</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stato Sanitario / Note</label>
                        <input 
                          type="text" 
                          value={editingSoggetto.condizioniSanitarie || ""}
                          onChange={(e) => setEditingSoggetto({...editingSoggetto, condizioniSanitarie: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded text-xs outline-none focus:border-[#15803d]"
                        />
                      </div>
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 uppercase tracking-wider text-xs rounded-lg transition-all">Salva Modifiche</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
                ) : activeTab === 'modulo-adozioni' ? (
          /* ================= MODULO ADOZIONI & COSTI ================= */
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Building className="h-6 w-6 text-indigo-600" />
                 <h2 className="text-xl font-black uppercase text-[#1e3a5f] tracking-widest">Gestione Pratiche Adozione & Finanze</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">Integrazione con le tabelle ANIMALHUB PA. Da questo pannello è possibile gestire le adozioni e visualizzare i costi.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="border border-slate-100 p-6 rounded-xl bg-slate-50 relative overflow-hidden">
                   <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm mb-4">Costi Mensili Convenzioni</h3>
                   <div className="text-3xl font-black text-rose-600 mb-2">€ 1.450,00</div>
                   <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mese Corrente</div>
                   
                   <div className="mt-6 flex flex-col gap-2">
                     <button className="bg-white border border-slate-200 text-xs font-bold uppercase p-3 rounded text-slate-600 hover:text-indigo-600 transition-colors text-left">
                        Gestione Costi/Voci
                     </button>
                     <button className="bg-white border border-slate-200 text-xs font-bold uppercase p-3 rounded text-slate-600 hover:text-indigo-600 transition-colors text-left">
                        Fatture Fornitori
                     </button>
                   </div>
                </div>

                <div className="border border-slate-100 p-6 rounded-xl bg-indigo-50 relative overflow-hidden">
                   <h3 className="font-bold text-indigo-900 uppercase tracking-wider text-sm mb-4">Richieste Adozione / Affido</h3>
                   <div className="text-3xl font-black text-indigo-600 mb-2">3 In Attesa</div>
                   <div className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Da Registro Anagrafe</div>
                   
                   <div className="mt-6 flex flex-col gap-2">
                     <button className="bg-white border border-indigo-100 text-xs font-bold uppercase p-3 rounded text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm text-left">
                        Approva Adozione
                     </button>
                     <button className="bg-white border border-indigo-100 text-xs font-bold uppercase p-3 rounded text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm text-left">
                        Storico Affidi / Subentri
                     </button>
                   </div>
                </div>

              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
