import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, ShieldAlert, BadgeInfo, CheckCircle, 
  Download, Filter, Search, User, FileSpreadsheet, Plus, 
  Activity, Star, Sparkles, Building, Phone, Calendar, CheckSquare,
  Dog, Cat, FileText, AlertTriangle, X, Printer, Lock
} from 'lucide-react';
import AppMap from '@/src/components/map/Map';
import { AnimalSpecie, SegnalazioneStato, Segnalazione } from '../types';
import GestioneOperatoriTab from '@/src/components/GestioneOperatoriTab';
import { popup } from '../lib/popup';
import PageHeader from '../components/layout/PageHeader';

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
  const [activeTab, setActiveTab] = useState<'statistiche' | 'modulo-b' | 'modulo-c' | 'modulo-adozioni' | 'gestione-operatori'>('statistiche');
  const [activeComune, setActiveComune] = useState(() => (localStorage.getItem('active_comune') || 'naro').toLowerCase());
  const [siteName, setSiteName] = useState("Comune di Naro");
  const [reports, setReports] = useState<Segnalazione[]>([]);
  const [selectedReport, setSelectedReport] = useState<Segnalazione | null>(null);
  const [registro, setRegistro] = useState<RegistroAnimale[]>([]);
  const [logs, setLogs] = useState<LogIntervento[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string; comune_key: string; visible_modules?: ('statistiche' | 'modulo-b' | 'modulo-c' | 'modulo-adozioni')[] | null } | null>(null);
  const [logsOffset, setLogsOffset] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);

  // ECOSYSTEM STATE VARIABLES FOR ADOPTIONS & FINANCES
  const [adozioni, setAdozioni] = useState<any[]>([]);
  const [adozioniLogs, setAdozioniLogs] = useState<any[]>([]);
  const [editingAdozione, setEditingAdozione] = useState<any | null>(null);
  const [printingAdozione, setPrintingAdozione] = useState<any | null>(null);
  const [strutture, setStrutture] = useState<any[]>([]);
  const [convenzioni, setConvenzioni] = useState<any[]>([]);
  const [fatture, setFatture] = useState<any[]>([]);
  
  const [showNuovaAdozioneModal, setShowNuovaAdozioneModal] = useState(false);
  const [showNuovaStrutturaModal, setShowNuovaStrutturaModal] = useState(false);
  const [showNuovaFatturaModal, setShowNuovaFatturaModal] = useState(false);
  const [showNuovaConvenzioneModal, setShowNuovaConvenzioneModal] = useState(false);

  // Form states
  const [formAdozione, setFormAdozione] = useState({
    registroId: '',
    nome: '',
    cf: '',
    tel: '',
    tel2: '',
    email: '',
    nato_a: '',
    nato_prov: '',
    nato_il: '',
    residente_a: '',
    residente_prov: '',
    via: '',
    via_num: '',
    via_int_scala: '',
    luogo_detenzione: '',
    documento_tipo: 'CARTA_IDENTITA',
    documento_numero: '',
    documento_data: '',
    documento_ente: '',
    richiesta_tipo: 'ADOZIONE_DEFINITIVA',
    a_partire_da: '',
    donazione_euro: '',
    impegno_sterilizzazione: 'SI',
    note_operatore: ''
  });
  const [formStruttura, setFormStruttura] = useState({ nome: '', tipo: 'CANILE', indirizzo: '', telefono: '', capacitaMax: 100 });
  const [formFattura, setFormFattura] = useState({ fornitore: '', numero: '', data: '', importo: '', stato: 'DA_PAGARE' });
  const [formConvenzione, setFormConvenzione] = useState({ strutturaId: '', tipoServizio: '', dataInizio: '', dataFine: '', importoAnnuo: '', stato: 'ATTIVA' });

  const fetchAdozioni = async () => {
    try {
      const res = await fetch('/api/adozioni');
      if (res.ok) {
        const data = await res.json();
        setAdozioni(data);
      }
    } catch (e) {
      console.error("Error fetching adozioni", e);
    }
  };

  const fetchStrutture = async () => {
    try {
      const res = await fetch('/api/strutture');
      if (res.ok) {
        const data = await res.json();
        setStrutture(data);
      }
    } catch (e) {
      console.error("Error fetching strutture", e);
    }
  };

  const fetchFatture = async () => {
    try {
      const res = await fetch('/api/fatture');
      if (res.ok) {
        const data = await res.json();
        setFatture(data);
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  const fetchConvenzioni = async () => {
    try {
      const res = await fetch('/api/convenzioni');
      if (res.ok) {
        const data = await res.json();
        setConvenzioni(data);
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  const fetchAdozioniLogs = async () => {
    try {
      const res = await fetch('/api/adozioni/logs');
      if (res.ok) {
        setAdozioniLogs(await res.json());
      }
    } catch (e) {
      console.error("Error loading adozioni logs", e);
    }
  };

  const handleDeleteAdoption = (id: number) => {
    popup.confirm(
      "Sei sicuro di voler eliminare definitivamente questa richiesta di adozione dal registro?",
      async () => {
        try {
          const res = await fetch(`/api/adozioni/${id}`, { method: 'DELETE' });
          if (res.ok) {
            popup.success("Richiesta di adozione eliminata.");
            fetchAdozioni();
            fetchAdozioniLogs();
          } else {
            const err = await res.json();
            popup.error(err.error || "Errore durante l'eliminazione.");
          }
        } catch (e) {
          popup.error("Errore imprevisto.");
        }
      },
      "Eliminazione Adozione"
    );
  };

  const handleCloneAdoption = (id: number) => {
    popup.confirm(
      "Sei sicuro di voler clonare questa richiesta di adozione? Verrà creata una nuova copia nello stato iniziale.",
      async () => {
        try {
          const res = await fetch(`/api/adozioni/${id}/clona`, { method: 'POST' });
          if (res.ok) {
            popup.success("Richiesta di adozione clonata con successo!");
            fetchAdozioni();
            fetchAdozioniLogs();
          } else {
            const err = await res.json();
            popup.error(err.error || "Errore durante la clonazione.");
          }
        } catch (e) {
          popup.error("Errore imprevisto.");
        }
      },
      "Clonazione Adozione"
    );
  };

  const startEditingAdozione = (adop: any) => {
    let extraDetails = {
      tel2: '',
      nato_a: '',
      nato_prov: '',
      nato_il: '',
      residente_a: '',
      residente_prov: '',
      via: '',
      via_num: '',
      via_int_scala: '',
      luogo_detenzione: '',
      documento_tipo: 'CARTA_IDENTITA',
      documento_numero: '',
      documento_data: '',
      documento_ente: '',
      richiesta_tipo: 'ADOZIONE_DEFINITIVA',
      a_partire_da: '',
      donazione_euro: '',
      impegno_sterilizzazione: 'SI',
      note_operatore: adop.note || ''
    };

    if (adop.note && adop.note.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(adop.note);
        extraDetails = { ...extraDetails, ...parsed };
      } catch (e) {}
    }

    setEditingAdozione({
      ...adop,
      ...extraDetails
    });
  };

  const handleEditAdoptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdozione) return;
    try {
      const extraDetails = {
        tel2: editingAdozione.tel2 || '',
        nato_a: editingAdozione.nato_a || '',
        nato_prov: editingAdozione.nato_prov || '',
        nato_il: editingAdozione.nato_il || '',
        residente_a: editingAdozione.residente_a || '',
        residente_prov: editingAdozione.residente_prov || '',
        via: editingAdozione.via || '',
        via_num: editingAdozione.via_num || '',
        via_int_scala: editingAdozione.via_int_scala || '',
        luogo_detenzione: editingAdozione.luogo_detenzione || '',
        documento_tipo: editingAdozione.documento_tipo || 'CARTA_IDENTITA',
        documento_numero: editingAdozione.documento_numero || '',
        documento_data: editingAdozione.documento_data || '',
        documento_ente: editingAdozione.documento_ente || '',
        richiesta_tipo: editingAdozione.richiesta_tipo || 'ADOZIONE_DEFINITIVA',
        a_partire_da: editingAdozione.a_partire_da || '',
        donazione_euro: editingAdozione.donazione_euro || '',
        impegno_sterilizzazione: editingAdozione.impegno_sterilizzazione || 'SI',
        note_operatore: editingAdozione.note_operatore || ''
      };

      const payload = {
        ...editingAdozione,
        note: JSON.stringify(extraDetails)
      };

      const res = await fetch(`/api/adozioni/${editingAdozione.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        popup.success("Pratica di adozione modificata con successo!");
        setEditingAdozione(null);
        fetchAdozioni();
        fetchAdozioniLogs();
      } else {
        const err = await res.json();
        popup.error(err.error || "Errore durante il salvataggio.");
      }
    } catch (e) {
      popup.error("Errore imprevisto durante il salvataggio.");
    }
  };

  useEffect(() => {
    if (activeTab === 'modulo-adozioni') {
      fetchAdozioni();
      fetchStrutture();
      fetchFatture();
      fetchConvenzioni();
      fetchAdozioniLogs();
    }
  }, [activeTab]);

  const handleApproveAdoption = async (id: number) => {
    try {
      const res = await fetch(`/api/adozioni/${id}/stato`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'APPROVATA', esito: 'CANDIDATO_IDONEO', note: 'Certificato approvato dall\'ente comunale.' })
      });
      if (res.ok) {
        popup.success("Adozione approvata con successo!");
        fetchAdozioni();
        // Reload registry list to sync updated states
        const regRes = await fetch('/api/registro');
        if (regRes.ok) setRegistro(await regRes.json());
      }
    } catch(e) {
      popup.error("Errore nell'approvazione");
    }
  };

  const handleRejectAdoption = async (id: number) => {
    try {
      const res = await fetch(`/api/adozioni/${id}/stato`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'RIFIUTATA', esito: 'NON_SUPPORTATO', note: 'Richiesta respinta dall\'operatore.' })
      });
      if (res.ok) {
        popup.success("Adozione rifiutata.");
        fetchAdozioni();
      }
    } catch(e) {
      popup.error("Errore nel rifiuto");
    }
  };

  const handleCreaAdozione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAdozione.registroId) {
      popup.error("Seleziona prima un animale dal registro!");
      return;
    }
    try {
      const extraDetails = {
        tel2: formAdozione.tel2,
        nato_a: formAdozione.nato_a,
        nato_prov: formAdozione.nato_prov,
        nato_il: formAdozione.nato_il,
        residente_a: formAdozione.residente_a,
        residente_prov: formAdozione.residente_prov,
        via: formAdozione.via,
        via_num: formAdozione.via_num,
        via_int_scala: formAdozione.via_int_scala,
        luogo_detenzione: formAdozione.luogo_detenzione,
        documento_tipo: formAdozione.documento_tipo,
        documento_numero: formAdozione.documento_numero,
        documento_data: formAdozione.documento_data,
        documento_ente: formAdozione.documento_ente,
        richiesta_tipo: formAdozione.richiesta_tipo,
        a_partire_da: formAdozione.a_partire_da,
        donazione_euro: formAdozione.donazione_euro,
        impegno_sterilizzazione: formAdozione.impegno_sterilizzazione,
        note_operatore: formAdozione.note_operatore
      };

      const res = await fetch('/api/adozioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registro_id: formAdozione.registroId,
          adottante_nome: formAdozione.nome,
          adottante_cf: formAdozione.cf,
          adottante_tel: formAdozione.tel,
          adottante_email: formAdozione.email,
          note: JSON.stringify(extraDetails)
        })
      });
      if (res.ok) {
        popup.success("Richiesta di adozione salvata con successo!");
        setFormAdozione({
          registroId: '',
          nome: '',
          cf: '',
          tel: '',
          tel2: '',
          email: '',
          nato_a: '',
          nato_prov: '',
          nato_il: '',
          residente_a: '',
          residente_prov: '',
          via: '',
          via_num: '',
          via_int_scala: '',
          luogo_detenzione: '',
          documento_tipo: 'CARTA_IDENTITA',
          documento_numero: '',
          documento_data: '',
          documento_ente: '',
          richiesta_tipo: 'ADOZIONE_DEFINITIVA',
          a_partire_da: '',
          donazione_euro: '',
          impegno_sterilizzazione: 'SI',
          note_operatore: ''
        });
        setShowNuovaAdozioneModal(false);
        fetchAdozioni();
      }
    } catch (e) {
      popup.error("Errore durante il salvataggio.");
    }
  };

  const handleCreaStruttura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/strutture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formStruttura.nome,
          tipo: formStruttura.tipo,
          indirizzo: formStruttura.indirizzo,
          telefono: formStruttura.telefono,
          capacita_max: formStruttura.capacitaMax,
          postazioni_occupate: 0
        })
      });
      if (res.ok) {
        popup.success("Nuova struttura convenzionata registrata!");
        setFormStruttura({ nome: '', tipo: 'CANILE', indirizzo: '', telefono: '', capacitaMax: 100 });
        setShowNuovaStrutturaModal(false);
        fetchStrutture();
      }
    } catch(e) {
      popup.error("Errore durante l'inserimento.");
    }
  };

  const handleCreaFattura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornitore: formFattura.fornitore,
          numero_fattura: formFattura.numero,
          data_emissione: formFattura.data,
          importo_totale: parseFloat(formFattura.importo),
          stato: formFattura.stato
        })
      });
      if (res.ok) {
        popup.success("Fattura registrata con successo!");
        setFormFattura({ fornitore: '', numero: '', data: '', importo: '', stato: 'DA_PAGARE' });
        setShowNuovaFatturaModal(false);
        fetchFatture();
      }
    } catch(e) {
      popup.error("Errore durante l'inserimento.");
    }
  };

  const handleCreaConvenzione = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/convenzioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          struttura_id: parseInt(formConvenzione.strutturaId),
          tipo_servizio: formConvenzione.tipoServizio,
          data_inizio: formConvenzione.dataInizio,
          data_fine: formConvenzione.dataFine,
          importo_annuo: parseFloat(formConvenzione.importoAnnuo),
          stato: formConvenzione.stato
        })
      });
      if (res.ok) {
        popup.success("Nuova convenzione registrata con successo!");
        setFormConvenzione({ strutturaId: '', tipoServizio: '', dataInizio: '', dataFine: '', importoAnnuo: '', stato: 'ATTIVA' });
        setShowNuovaConvenzioneModal(false);
        fetchConvenzioni();
      }
    } catch(e) {
      popup.error("Errore durante la creazione.");
    }
  };

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
            const user = data.user;
            
            // Auto-select the first visible module tab
            let allowed: string[] = ['modulo-b', 'modulo-c'];
            if (user.role === 'ADMIN' || user.role === 'Admin') {
              allowed = ['statistiche', 'modulo-b', 'modulo-c', 'modulo-adozioni', 'gestione-operatori'];
            } else if (user.visible_modules) {
              allowed = user.visible_modules;
            }

            if (allowed.length > 0 && !allowed.includes('modulo-b')) {
              setActiveTab(allowed[0] as any);
            }
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
  const [filterModuloCSpecie, setFilterModuloCSpecie] = useState<string>('Tutte');
  const [filterModuloCSesso, setFilterModuloCSesso] = useState<string>('Tutti');
  const [filterModuloCTaglia, setFilterModuloCTaglia] = useState<string>('Tutte');
  const [filterModuloCStato, setFilterModuloCStato] = useState<string>('Tutti');
  const [moduloCViewMode, setModuloCViewMode] = useState<'card' | 'list' | 'table'>('card');
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
      popup.error("Inserire sia la firma dell'operatore che la nota dell'intervento.");
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
    popup.success("Aggiornamento salvato con successo e firmato dall'operatore!");
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
      popup.error("Errore durante l'aggiornamento dello stato.");
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
      popup.error("Nessun record corrispondente ai filtri per l'esportazione.");
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
    if (!newSoggetto.microchip || !/^\d{15}$/.test(newSoggetto.microchip)) {
      popup.error("Il codice microchip deve contenere esattamente 15 cifre numeriche conforme agli standard nazionali.");
      return;
    }
    if (!newSoggetto.colore) {
      popup.error("Specificare il colore del mantello.");
      return;
    }

    // Microchip local duplication check
    const microchipExists = registro.some(r => r.microchip === newSoggetto.microchip);
    if (microchipExists) {
      popup.error(`Errore di validazione: Il codice microchip ${newSoggetto.microchip} risulta già registrato in questo archivio comunale.`);
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
        popup.success("Soggetto iscritto con successo nell'Archivio Anagrafico ed esportato nel database della Regione Siciliana!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        popup.error(errorData.error || "Errore durante la registrazione.");
      }
    } catch (e) {
      popup.error("Errore di rete.");
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
        popup.success("Anagrafica aggiornata con successo.");
      } else {
        popup.error("Errore durante l'aggiornamento.");
      }
    } catch (e) {
      popup.error("Errore di rete.");
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
    if (filterModuloCSpecie !== 'Tutte' && item.specie !== filterModuloCSpecie) return false;
    if (filterModuloCSesso !== 'Tutti' && item.sesso !== filterModuloCSesso) return false;
    if (filterModuloCTaglia !== 'Tutte' && item.taglia !== filterModuloCTaglia) return false;
    if (filterModuloCStato !== 'Tutti' && item.stato !== filterModuloCStato) return false;
    
    if (!searchMicrochip) return true;
    return item.microchip.includes(searchMicrochip) || 
           (item.nome && item.nome.toLowerCase().includes(searchMicrochip.toLowerCase())) ||
           item.colore.toLowerCase().includes(searchMicrochip.toLowerCase());
  });

  const allowedTabs = [
    { id: 'statistiche', name: 'Dashboard Statistiche', allowed: currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin' || currentUser?.visible_modules?.includes('statistiche') },
    { id: 'modulo-b', name: 'Modulo B — Operativa Uffici', allowed: !currentUser?.visible_modules || currentUser.visible_modules.includes('modulo-b') },
    { id: 'modulo-c', name: 'Modulo C — Archivio Digitale', allowed: !currentUser?.visible_modules || currentUser.visible_modules.includes('modulo-c') },
    { id: 'modulo-adozioni', name: 'Modulo Adozioni & Costi', allowed: !currentUser?.visible_modules || currentUser.visible_modules.includes('modulo-adozioni') },
    { id: 'gestione-operatori', name: 'Gestione Operatori 👥', allowed: currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin' }
  ];

  if (printingAdozione) {
    let extraPrintDetails = {
      tel2: '',
      nato_a: 'Naro',
      nato_prov: 'AG',
      nato_il: '',
      residente_a: 'Naro',
      residente_prov: 'AG',
      via: '',
      via_num: '',
      via_int_scala: '',
      luogo_detenzione: 'Stessa residenza',
      documento_tipo: 'CARTA_IDENTITA',
      documento_numero: '',
      documento_data: '',
      documento_ente: 'Comune di Naro',
      richiesta_tipo: 'ADOZIONE_DEFINITIVA',
      a_partire_da: '',
      donazione_euro: '0',
      impegno_sterilizzazione: 'SI',
      note_operatore: ''
    };

    if (printingAdozione.note && printingAdozione.note.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(printingAdozione.note);
        extraPrintDetails = { ...extraPrintDetails, ...parsed };
      } catch (e) {}
    } else {
      extraPrintDetails.note_operatore = printingAdozione.note || '';
    }

    const animalName = printingAdozione.animal_nome || 'Soggetto registrato';
    const animalMicrochip = printingAdozione.animal_microchip || 'NESSUNO / IN ATTESA';
    const animalSpecie = printingAdozione.animal_specie || 'CANE';
    const animalFoto = printingAdozione.animal_foto || '';

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4 print:bg-white print:p-0 font-sans text-slate-800">
        {/* ACTION BAR: Hidden on print */}
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <Printer className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black uppercase text-slate-800">Modalità Stampa Verbale</p>
              <p className="text-xs text-slate-500">Pratica #{printingAdozione.id} • Adottante: {printingAdozione.adottante_nome}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Stampa Verbale / Salva PDF
            </button>
            <button
              onClick={() => setPrintingAdozione(null)}
              className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer"
            >
              Chiudi Anteprima
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA (A4 format representation) */}
        <div className="w-full max-w-[210mm] min-h-[297mm] bg-white p-[15mm] border border-slate-300 shadow-2xl rounded-sm print:shadow-none print:border-none print:p-0 relative flex flex-col justify-between">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#1e3a5f] pb-4 mb-6">
              <div className="flex items-center gap-4">
                {/* STEMMA COMUNALE - SVG elegant Naro coat of arms graphic representation */}
                <div className="h-20 w-16 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 120" className="w-full h-full text-[#1e3a5f]">
                    <path d="M10,10 L90,10 L90,70 C90,100 50,115 50,115 C50,115 10,100 10,70 Z" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path d="M10,10 L90,10 L90,70 C90,100 50,115 50,115 C50,115 10,100 10,70 Z" fill="#f8fafc" />
                    <rect x="35" y="45" width="30" height="30" fill="currentColor" rx="2" />
                    <rect x="40" y="25" width="20" height="20" fill="currentColor" rx="1" />
                    <rect x="25" y="55" width="8" height="20" fill="currentColor" />
                    <rect x="67" y="55" width="8" height="20" fill="currentColor" />
                    <circle cx="50" cy="18" r="4" fill="#d97706" />
                    <circle cx="34" cy="21" r="3" fill="#d97706" />
                    <circle cx="66" cy="21" r="3" fill="#d97706" />
                    <path d="M 20 85 Q 35 80 50 85 T 80 85" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    <path d="M 20 90 Q 35 85 50 90 T 80 90" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-left w-full">
                  <h1 className="text-lg font-black tracking-wide text-[#1e3a5f] uppercase leading-tight font-sans">
                    Città di Naro
                  </h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provincia di Agrigento</p>
                  <p className="text-[10px] font-extrabold text-slate-700 uppercase mt-1">Settore Vigilanza e Sanità Animale</p>
                  <p className="text-[9px] text-slate-400 font-medium">Ufficio di Tutela Ambientale • Gestione Territoriale del Randagismo</p>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between h-full min-w-[150px]">
                <div className="bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-right">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Pratica Numero</span>
                  <span className="text-xs font-mono font-black text-slate-800">COF-AD-{printingAdozione.id || 'N.D.'}</span>
                </div>
                <div className="text-[8px] text-slate-400 mt-2 font-mono">
                  Generato il {new Date().toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-base font-black tracking-wide text-[#1e3a5f] uppercase border-b border-dashed border-slate-300 pb-2 inline-block">
                Verbale di Affidamento e Co-Adozione di Animale d'Affezione
              </h2>
              <p className="text-[9px] text-slate-500 italic mt-1.5">
                Redatto ai sensi della Legge Regionale Siciliana del 3 luglio 2000, n. 15 e s.m.i. sul controllo del randagismo.
              </p>
            </div>

            {/* SEZIONE I: ANIMALE */}
            <div className="border border-slate-200 rounded-lg mb-5 overflow-hidden">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider flex justify-between items-center">
                <span>Sezione I — Dati Identificativi del Soggetto (da Registro Comunale)</span>
                {animalMicrochip !== 'NESSUNO / IN ATTESA' && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-black border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-mono">
                    Microchip Identificato
                  </span>
                )}
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                
                {/* Print/Visual image */}
                {animalFoto && (
                  <div className="sm:col-span-1 flex justify-center print:block">
                    <img
                      src={animalFoto}
                      alt={animalName}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200 max-h-24 shadow-sm"
                    />
                  </div>
                )}

                <div className={`${animalFoto ? 'sm:col-span-3' : 'sm:col-span-4'} grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-left`}>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Nome del Soggetto:</span>
                    <span className="font-extrabold text-slate-800 uppercase">{animalName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Codice Microchip:</span>
                    <span className="font-mono font-black text-rose-700 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5">{animalMicrochip}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Specie / Genere:</span>
                    <span className="font-bold text-slate-700">{animalSpecie}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Razza / Meticciato:</span>
                    <span className="font-bold text-slate-700">{extraPrintDetails.note_operatore ? 'Incrocio registrato' : 'Meticcio'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Età Approssimativa / Taglia:</span>
                    <span className="font-bold text-slate-700">Adulto / Media</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block font-sans">Condizioni Sanitarie Generali:</span>
                    <span className="font-extrabold text-[#15803d]">Sano, Sottoposto a Profilassi ASP Agrigento</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE II: ADOTTANTE */}
            <div className="border border-slate-200 rounded-lg mb-5 overflow-hidden">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider">
                Sezione II — Dichiarante Adottante / Affidatario
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs text-left">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Cognome e Nome:</span>
                  <span className="font-black text-slate-800 text-sm uppercase">{printingAdozione.adottante_nome}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Codice Fiscale:</span>
                  <span className="font-mono font-black text-slate-800 uppercase">{printingAdozione.adottante_cf}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Nato/a il / Luogo:</span>
                  <span className="font-bold text-slate-700">
                    {extraPrintDetails.nato_il ? new Date(extraPrintDetails.nato_il).toLocaleDateString('it-IT') : 'N.D.'} a {extraPrintDetails.nato_a} ({extraPrintDetails.nato_prov || 'AG'})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Residente a / Comune:</span>
                  <span className="font-bold text-slate-700">
                    {extraPrintDetails.residente_a} ({extraPrintDetails.residente_prov})
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Indirizzo di Domicilio Legale:</span>
                  <span className="font-bold text-slate-700">
                    Via/Piazza {extraPrintDetails.via || '__________________'} n. {extraPrintDetails.via_num || '___'} {extraPrintDetails.via_int_scala && `(Sc/Int: ${extraPrintDetails.via_int_scala})`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Recapito Telefonico Primario / Secondario:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {printingAdozione.adottante_tel} {extraPrintDetails.tel2 && `/ ${extraPrintDetails.tel2}`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Indirizzo Email / PEC:</span>
                  <span className="font-bold text-slate-700">{printingAdozione.adottante_email}</span>
                </div>

                <div className="sm:col-span-2 border-t border-slate-100 pt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Documento Identificativo esibito:</span>
                    <span className="font-bold text-slate-700 uppercase">
                      {extraPrintDetails.documento_tipo?.replace('_', ' ') || 'CARTA D\'IDENTITA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Numero / Ente Rilasciante:</span>
                    <span className="font-bold text-slate-700">
                      N. {extraPrintDetails.documento_numero || '________________'} - Ril. da {extraPrintDetails.documento_ente || 'N.D.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE III: VINCOLI */}
            <div className="border border-slate-200 rounded-lg mb-5 overflow-hidden">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider">
                Sezione III — Disciplina dell'Affido, Sterilizzazione ed Obblighi Legali
              </div>
              <div className="p-4 text-[10px] space-y-2.5 text-left text-slate-700 leading-relaxed">
                <p>
                  <strong>1) REGIME DI DETENZIONE ED ALLOGGIO:</strong> L'adottante dichiara che l'animale alloggerà permanentemente presso:  
                  <span className="font-bold text-slate-800 bg-slate-50 px-1 border border-slate-100 rounded ml-1">{extraPrintDetails.luogo_detenzione || 'La propria residenza'}</span>. 
                  Si impegna ad assicurare idonee condizioni di benessere ai sensi delle norme vigenti e dei regolamenti comunali di tutela degli animali.
                </p>
                <p>
                  <strong>2) VALIDITÀ DEL RAPPORTO DI AFFIDO:</strong> La pratica viene avviata sotto il regime d'istruttoria di:  
                  <span className="font-black text-slate-800 uppercase bg-slate-50 px-1 border border-slate-100 rounded ml-1">{extraPrintDetails.richiesta_tipo?.replace('_', ' ') || 'ADOZIONE DEFINITIVA'}</span>.
                  {extraPrintDetails.a_partire_da && (
                    <span> Con decorrenza formale delle responsabilità civili e penali a partire dal giorno <strong>{new Date(extraPrintDetails.a_partire_da).toLocaleDateString('it-IT')}</strong>.</span>
                  )}
                </p>
                <p>
                  <strong>3) IMPEGNO DI STERILIZZAZIONE ANIMALE:</strong> {extraPrintDetails.impegno_sterilizzazione === 'SI' ? (
                    <span className="text-red-700 font-extrabold bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                      ⚠️ OBBLIGATORIO: L'adottante si assume formale vincolo giuridico a sottoporre l'animale a sterilizzazione entro i termini concordati con gli uffici comunali e comunicarne l'avvenuto intervento.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                      ✓ ESENTE: L'animale risulta già sottoposto ad ovariectomia/castrazione chirurgia o esente per età/motivi di salute certificati.
                    </span>
                  )}
                </p>
                <p>
                  <strong>4) VIGILANZA POST-AFFIDO:</strong> L'adottante acconsente espressamente a visite e ispezioni domiciliari da parte delle Guardie Zoofile comunali o degli Agenti del Comando di Polizia Municipale di Naro, per verificare il corretto accudimento del soggetto.
                </p>
              </div>
            </div>

            {/* SEZIONE IV: DISPOSIZIONI */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-[#1e3a5f] text-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider">
                Sezione IV — Conclusioni Amministrative dell'Ufficio Tutela Animali
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Stato Generale della Pratica:</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded uppercase mt-0.5 border ${
                    printingAdozione.stato === 'APPROVATA' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    🔴 {printingAdozione.stato || 'CREATA'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Esito Istruttorio Deliberato:</span>
                  <span className="font-extrabold text-slate-800 uppercase">
                    {printingAdozione.esito?.replace('_', ' ') || 'IDONEO (ISTRUTTORIA FAVOREVOLE)'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Note Addizionali ed Accertamenti Sociali eseguiti dall'Ufficio:</span>
                  <p className="text-slate-600 bg-slate-50 border border-slate-150 p-2.5 rounded font-medium mt-1 leading-relaxed text-[11px] italic">
                    "{extraPrintDetails.note_operatore || 'Istruttoria conclusa positivamente. Spazi idonei e recintati, assenza di precedenti sanitari ostativi a carico dell\'interessato.'}"
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Contributo Donatore Incassato:</span>
                  <span className="font-extrabold text-slate-700 block mt-0.5">
                    € {parseFloat(extraPrintDetails.donazione_euro || '0').toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Copie Verbale Distribuite:</span>
                  <span className="font-bold text-slate-500 block">N. 3 (Adottante, Archivio Comunale, ASP Agrigento)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Underwriting Block */}
          <div className="mt-12 border-t pt-8">
            <p className="text-[10px] text-slate-500 text-left mb-6 font-semibold">
              Fatto, letto, confermato e sottoscritto in Naro (AG), lì {new Date(printingAdozione.createdAt || Date.now()).toLocaleDateString('it-IT')}
            </p>
            <div className="grid grid-cols-2 gap-12 text-center text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-12">L'AFFIDATARIO (Adottante)</span>
                <div className="w-48 border-b border-dashed border-slate-400 mb-1"></div>
                <span className="text-[8px] text-slate-400">(Firma per accettazione ed impegni di legge)</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-12">L'OPERATORE COMUNALE PREPOSTO</span>
                <div className="w-48 border-b border-dashed border-slate-400 mb-1"></div>
                <span className="text-[8px] text-slate-400">(Timbro dell'Ufficio e Firma dell'incaricato)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-32 pt-24" style={{ borderWidth: '0px', paddingTop: '110px' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 w-full flex flex-col gap-6 flex-1 animate-fadeIn">
        
        {/* Page Header */}
        <PageHeader
          sopraTitolo={`PORTALE OPERATIVO ${activeComune.toUpperCase()}`}
          titolo="Portale Operativo Municipale"
          sottotitolo={`Pannello di controllo del ${siteName} per la gestione territoriale del randagismo e archivio sanitario ASP.`}
        >
          <div className="flex justify-end">
            <button 
              onClick={handleExportRegional}
              className="flex items-center gap-2 bg-[#15803d]/90 hover:bg-[#166534] text-white font-black text-[10px] uppercase tracking-wider py-3 px-5 rounded-xl border border-white/10 shadow-sm transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" /> Esporta Flusso Regione Siciliana
            </button>
          </div>
        </PageHeader>

        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row gap-4 mt-2 border-b border-slate-200 items-stretch md:items-center">
          <div className="flex flex-wrap gap-4">
            {allowedTabs.filter(t => t.allowed).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.id ? 'border-[#15803d] text-[#15803d]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin') && (
            <a
              href="/admin/config"
              className="pb-4 px-2 font-black text-xs uppercase tracking-wider transition-all border-b-2 border-transparent text-amber-600 hover:text-amber-700 flex items-center gap-1.5 md:ml-auto cursor-pointer"
            >
              Configurazione Sistema ⚙️
            </a>
          )}
        </div>

        <div className="w-full mt-6">
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
            {showAddSoggetto ? (
              /* DEDICATED FULL-PAGE INLINE CARD VIEW FOR INSERTION INSTEAD OF OVERLAY */
              <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                      Nuova Registrazione Anagrafica
                    </span>
                    <h3 className="text-2xl font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-2 pt-1.5">
                      <Star className="h-6 w-6 text-emerald-500 animate-spin-slow" /> Iscrizione Anagrafe Canina/Felina Sicilia
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Compila i dati ministeriali per registrare un nuovo soggetto sul territorio regionale.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAddSoggetto(false)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    ← Torna all'elenco
                  </button>
                </div>

                <form onSubmit={handleAddSoggettoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setShowAddSoggetto(false)}
                      className="px-5 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 bg-white"
                    >
                      Annulla e Torna
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-[#15803d] text-white rounded-lg font-bold text-xs uppercase hover:bg-[#166534]"
                    >
                      Registra e Sincronizza
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* REGULAR DATABASE VIEW */
              <>
                {/* Tool Bar & Quick Sinc Badge */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
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
                        <Star className="h-4 w-4 text-emerald-600 animate-pulse" /> Sincronizzato con Anagrafe
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
                                    popup.success(`Caricati con successo ${c} record!`);
                                  } catch(err) {
                                    popup.error("Errore caricamento CSV");
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                              />
                            </button>
                          </div>
                          <button 
                            onClick={() => setShowAddSoggetto(true)}
                            className="flex items-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#15803d]/20 transition-all uppercase tracking-wider cursor-pointer"
                          >
                            <Plus className="h-4 w-4" /> Registra Nuovo
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Specie */}
                      <select
                        value={filterModuloCSpecie}
                        onChange={(e) => setFilterModuloCSpecie(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50 min-w-[120px]"
                      >
                        <option value="Tutte">Tutte le Specie</option>
                        <option value="Cane">Cane</option>
                        <option value="Gatto">Gatto</option>
                      </select>
                      {/* Sesso */}
                      <select
                        value={filterModuloCSesso}
                        onChange={(e) => setFilterModuloCSesso(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50 min-w-[120px]"
                      >
                        <option value="Tutti">Tutti i Sessi</option>
                        <option value="M">Maschio (M)</option>
                        <option value="F">Femmina (F)</option>
                      </select>
                      {/* Taglia */}
                      <select
                        value={filterModuloCTaglia}
                        onChange={(e) => setFilterModuloCTaglia(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50 min-w-[120px]"
                      >
                        <option value="Tutte">Tutte le Taglie</option>
                        <option value="PICCOLA">Piccola</option>
                        <option value="MEDIA">Media</option>
                        <option value="GRANDE">Grande</option>
                      </select>
                      {/* Stato */}
                      <select
                        value={filterModuloCStato}
                        onChange={(e) => setFilterModuloCStato(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs font-bold text-[#1e3a5f] bg-slate-50 min-w-[140px]"
                      >
                        <option value="Tutti">Tutti gli Stati</option>
                        <option value="LIBERO">Libero sul Territorio</option>
                        <option value="CATTURATO">Catturato</option>
                        <option value="IN_CANILE">In Struttura</option>
                        <option value="ADOTTATO">Adottato</option>
                        <option value="STERILIZZATO">Sterilizzato/Reimmesso</option>
                        <option value="DECEDUTO">Deceduto</option>
                      </select>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setModuloCViewMode('card')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase ${moduloCViewMode === 'card' ? 'bg-white text-[#15803d] shadow-sm' : 'text-slate-500'}`}
                        title="Vista a Griglia"
                      >
                        Card
                      </button>
                      <button 
                        onClick={() => setModuloCViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase ${moduloCViewMode === 'list' ? 'bg-white text-[#15803d] shadow-sm' : 'text-slate-500'}`}
                        title="Vista ad Elenco"
                      >
                        Elenco
                      </button>
                      <button 
                        onClick={() => setModuloCViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase ${moduloCViewMode === 'table' ? 'bg-white text-[#15803d] shadow-sm' : 'text-slate-500'}`}
                        title="Vista a Tabella"
                      >
                        Tabella
                      </button>
                    </div>
                  </div>
                </div>

                {/* Database Animals display */}
            {moduloCViewMode === 'card' ? (
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
            ) : moduloCViewMode === 'list' ? (
              <div className="flex flex-col gap-4">
                {filteredRegistro.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 font-medium font-sans">
                    Nessun soggetto trovato nel database anagrafico comunale.
                  </div>
                ) : (
                  filteredRegistro.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 p-4 items-center">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative">
                        <img 
                          src={item.fotoUrl} 
                          alt={item.nome}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h4 className="text-lg font-black text-[#1e3a5f] truncate">{item.nome}</h4>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full text-white shadow-sm inline-block w-max ${
                            item.stato === 'LIBERO' ? 'bg-indigo-500' :
                            item.stato === 'CATTURATO' ? 'bg-orange-500' :
                            item.stato === 'IN_CANILE' ? 'bg-amber-600' :
                            item.stato === 'ADOTTATO' ? 'bg-emerald-500' :
                            item.stato === 'STERILIZZATO' ? 'bg-teal-500' : 'bg-red-600'
                          }`}>
                            {item.stato.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Microchip</span>
                            <span className="font-mono font-black text-[#1e3a5f]">{item.microchip}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Identikit</span>
                            <span className="font-semibold text-slate-600">{item.specie} · {item.sesso === 'M' ? 'M' : 'F'} · {item.taglia}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Colore</span>
                            <span className="font-semibold text-slate-600">{item.colore}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Condizioni</span>
                            <span className="font-semibold text-red-600">{item.condizioniSanitarie}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                        <div className="text-[9px] font-bold text-slate-400">Agg: {item.dataSincronizzazione}</div>
                        {currentUser?.role !== 'Volontario' && (
                          <button 
                            onClick={() => setEditingSoggetto(item)}
                            className="bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold px-4 py-2 rounded text-[10px] uppercase tracking-wider"
                          >
                            Modifica
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                      <th className="p-4">Animale</th>
                      <th className="p-4">Microchip</th>
                      <th className="p-4">Identikit</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4">Sanità</th>
                      <th className="p-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                    {filteredRegistro.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">Nessun soggetto trovato.</td>
                      </tr>
                    ) : (
                      filteredRegistro.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <img src={item.fotoUrl} alt="" className="w-10 h-10 rounded object-cover" />
                            <div>
                              <div className="font-black text-[#1e3a5f]">{item.nome}</div>
                              <div className="text-[10px] text-slate-400 tracking-wider uppercase">Agg: {item.dataSincronizzazione}</div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-black text-[#1e3a5f] text-xs tracking-wider">{item.microchip}</td>
                          <td className="p-4 text-xs text-slate-500">
                            {item.specie} · {item.sesso} · {item.taglia} · {item.colore}
                          </td>
                          <td className="p-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded text-white shadow-sm inline-block ${
                              item.stato === 'LIBERO' ? 'bg-indigo-500' :
                              item.stato === 'CATTURATO' ? 'bg-orange-500' :
                              item.stato === 'IN_CANILE' ? 'bg-amber-600' :
                              item.stato === 'ADOTTATO' ? 'bg-emerald-500' :
                              item.stato === 'STERILIZZATO' ? 'bg-teal-500' : 'bg-red-600'
                            }`}>
                              {item.stato.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-red-600">{item.condizioniSanitarie}</td>
                          <td className="p-4 text-right">
                            {currentUser?.role !== 'Volontario' && (
                              <button 
                                onClick={() => setEditingSoggetto(item)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase tracking-wider underline underline-offset-2"
                              >
                                Modifica
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

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

              </>
            )}

          </div>
                 ) : activeTab === 'modulo-adozioni' ? (
          /* ================= MODULO ADOZIONI & COSTI ================= */
          <div className="space-y-8 animate-fade-in text-left">
            
            {!showNuovaAdozioneModal && (
              <>
                {/* KPI OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-indigo-400">
                      <Activity className="h-10 w-10 opacity-30" />
                    </div>
                    <h3 className="font-extrabold text-indigo-900 uppercase tracking-wider text-xs mb-1">Pratiche in Valutazione</h3>
                    <div className="text-4xl font-black text-indigo-900">
                      {adozioni.filter(a => a.stato === 'IN_VALUTAZIONE' || a.stato === 'CREATA').length} Attive
                    </div>
                    <p className="text-xs text-indigo-600 font-bold mt-2">Dossier di affido in carico alle associazioni</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-emerald-400">
                      <Building className="h-10 w-10 opacity-30" />
                    </div>
                    <h3 className="font-extrabold text-emerald-900 uppercase tracking-wider text-xs mb-1">Capacità Canili & Gattili</h3>
                    <div className="text-4xl font-black text-emerald-900">
                      {strutture.reduce((acc, curr) => acc + (curr.postazioni_occupate || 0), 0)} / {strutture.reduce((acc, curr) => acc + (curr.capacita_max || 100), 0)}
                    </div>
                    <p className="text-xs text-emerald-600 font-bold mt-2">Posti occupati in strutture convenzionate</p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-rose-400">
                      <Briefcase className="h-10 w-10 opacity-30" />
                    </div>
                    <h3 className="font-extrabold text-rose-900 uppercase tracking-wider text-xs mb-1">Costi Totali Liquidati</h3>
                    <div className="text-4xl font-black text-rose-900">
                      € {fatture.reduce((acc, curr) => acc + (parseFloat(curr.importo_totale) || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-rose-600 font-bold mt-2">Spese complessive per ricoveri e assistenza</p>
                  </div>
                </div>

                {/* SEZIONE 1: ANAGRAFE DELLE ADOZIONI & AFFIDAMENTI */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1e3a5f] uppercase tracking-wider">Registro Adozioni Digitali (COF)</h3>
                    <p className="text-xs text-slate-500 font-bold">Monitoraggio pratiche di tutela, adozione e affidi dei randagi sul territorio di {siteName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNuovaAdozioneModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Nuova Pratica Adozione
                </button>
              </div>

              {adozioni.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BadgeInfo className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">Nessuna richiesta di adozione registrata nel database.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                        <th className="p-4">Animale</th>
                        <th className="p-4">Richiedente / CF</th>
                        <th className="p-4">Contatti</th>
                        <th className="p-4">Inserito / Modificato</th>
                        <th className="p-4">Data Pratica</th>
                        <th className="p-4">Stato</th>
                        <th className="p-4 text-right">Azioni Istruttoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700 bg-white">
                      {adozioni.map((adop) => (
                        <tr key={adop.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={adop.animal_foto || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150"}
                                alt={adop.animal_nome}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                              />
                              <div>
                                <p className="font-extrabold text-slate-800 leading-tight">{adop.animal_nome || "Animale Registrato"}</p>
                                <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">{adop.animal_specie || "CANE"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-850 font-extrabold">{adop.adottante_nome}</p>
                            <p className="text-[10px] font-mono text-slate-400">{adop.adottante_cf}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-slate-600">{adop.adottante_tel}</p>
                            <p className="text-xs text-slate-400 font-mono">{adop.adottante_email}</p>
                          </td>
                          <td className="p-4 text-xs">
                            <div className="space-y-0.5">
                              <p className="text-slate-700 font-bold">Inserito: <span className="text-indigo-600">@{adop.creato_da || "Sito Pubblico"}</span></p>
                              {adop.modificato_da ? (
                                <p className="text-[10px] text-slate-400">Modifica: <span className="text-emerald-600 font-bold">@{adop.modificato_da}</span></p>
                              ) : (
                                <p className="text-[10px] text-slate-350 italic">Nessuna modifica</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500">
                            {adop.data_richiesta ? new Date(adop.data_richiesta).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N.D."}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                adop.stato === "APPROVATA" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                adop.stato === "RIFIUTATA" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {adop.stato}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5 list-none">
                              {(adop.stato === "IN_VALUTAZIONE" || adop.stato === "CREATA") && currentUser?.role !== 'Volontario' && (
                                <>
                                  <button
                                    onClick={() => handleApproveAdoption(adop.id)}
                                    title="Approva Pratica"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" /> Approva
                                  </button>
                                  <button
                                    onClick={() => handleRejectAdoption(adop.id)}
                                    title="Respingi Pratica"
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" /> Respingi
                                  </button>
                                </>
                              )}

                              {currentUser?.role !== 'Volontario' && (
                                <button
                                  onClick={() => startEditingAdozione(adop)}
                                  title="Modifica Dati"
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  Modifica
                                </button>
                              )}

                              <button
                                onClick={() => setPrintingAdozione(adop)}
                                title="Stampa Modulo"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3" /> Stampa
                              </button>

                              {currentUser?.role !== 'Volontario' && (
                                <>
                                  <button
                                    onClick={() => handleCloneAdoption(adop.id)}
                                    title="Clona Pratica"
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
                                  >
                                    Clona
                                  </button>

                                  <button
                                    onClick={() => handleDeleteAdoption(adop.id)}
                                    title="Elimina"
                                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
                                  >
                                    Elimina
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AUDIT TRAIL LOG PANEL */}
            {currentUser?.role !== 'Volontario' && (
            <div className="bg-[#1e293b] text-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-705">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-base font-black uppercase tracking-wider text-indigo-350">Tracciabilità Operativa adozioni (Audit Trail DB)</h3>
                </div>
                <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20 font-mono">Sicurezza C.O.F.</span>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 font-mono scrollbar-thin scrollbar-thumb-slate-700">
                {adozioniLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Nessuna operazione registrata nel registro adozioni ancora.</p>
                ) : (
                  adozioniLogs.map((log: any) => (
                    <div key={log.id} className="text-xs flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2.5 rounded bg-slate-800/65 border border-slate-800 hover:bg-slate-800 transition-all text-left">
                      <span className="text-[#a5b4fc] w-32 shrink-0">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: '2-digit' }) : "N.D."}
                      </span>
                      <span className="text-[#34d399] font-bold w-24 shrink-0 uppercase">[{log.operazione}]</span>
                      <span className="text-[#2dd4bf] font-semibold w-24 shrink-0 font-mono">@{log.operatore}</span>
                      <span className="text-slate-350 flex-1">{log.dettagli}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}

            {/* SEZIONE 2: STRUTTURE ECOSYSTEM & CONVENZIONI ATTIVE */}
            {currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* BOARDING FACILITIES (CUSTODIA) */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-wider">Strutture di Custodia</h3>
                        <p className="text-[11px] text-slate-400 font-bold">Rifugi sanitari e alloggi convenzionati</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNuovaStrutturaModal(true)}
                      className="border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 bg-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-3 rounded-lg transition-colors active:scale-95 shadow-sm"
                    >
                      + Aggiungi Struttura
                    </button>
                  </div>

                  {strutture.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-slate-150 rounded-xl">
                      <p className="text-sm font-semibold text-slate-500">Nessun rifugio o clinica registrato.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {strutture.map((s) => (
                        <div key={s.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                s.tipo === "CANILE" ? "bg-amber-100 text-amber-800" :
                                s.tipo === "GATTILE" ? "bg-indigo-100 text-indigo-800" :
                                "bg-indigo-100 text-indigo-800 animate-pulse"
                              }`}>
                                {s.tipo}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">ID: #{s.id}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-base">{s.nome}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {s.indirizzo}
                            </p>
                            {s.telefono && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" /> {s.telefono}
                              </p>
                            )}
                          </div>

                          {/* Gage Capienza */}
                          <div className="space-y-1 pt-2 border-t border-slate-200/60">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Saturazione:</span>
                              <span className="font-extrabold text-[#1e3a5f]">
                                {s.postazioni_occupate || 0} / {s.capacita_max || 100} ({Math.round(((s.postazioni_occupate || 0) / (s.capacita_max || 100)) * 100)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  ((s.postazioni_occupate || 0) / (s.capacita_max || 100)) > 0.85 ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, ((s.postazioni_occupate || 0) / (s.capacita_max || 100)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COVENANTS & ACCORDS (CONVENZIONI) */}
                <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#1e3a5f] uppercase tracking-wider">Convenzioni Attive</h3>
                        <p className="text-[11px] text-slate-400 font-bold">Dotazioni economiche e atti istituzionali</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNuovaConvenzioneModal(true)}
                      className="border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-slate-600 bg-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-3 rounded-lg transition-colors active:scale-95 shadow-sm"
                    >
                      + Nuova Convenzione
                    </button>
                  </div>

                  {convenzioni.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-250 rounded-xl">
                      <p className="text-sm font-semibold text-slate-500">Nessun patto economico registrato.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {convenzioni.map((c) => (
                        <div key={c.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-extrabold text-slate-800 text-sm">{c.struttura_nome || "Rifugio Convenzionato"}</p>
                            <p className="text-xs text-indigo-600 font-extrabold">{c.tipo_servizio}</p>
                            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              Dal {new Date(c.data_inizio).toLocaleDateString('it-IT')} al {new Date(c.data_fine).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <div className="text-right space-y-1 shrink-0">
                            <p className="text-sm font-black text-rose-600">€ {(parseFloat(c.importo_annuo) || 0).toLocaleString('it-IT')}</p>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-100">
                              {c.stato || "ATTIVA"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <Lock className="h-10 w-10 text-slate-400" />
                <h3 className="text-md font-black text-[#1e3a5f] uppercase tracking-wider">🔒 Strutture e Convenzioni Protette</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-lg leading-relaxed">
                  L'accesso alle <strong>Strutture di Custodia</strong> ed alle relative <strong>Convenzioni Comunali Attive</strong> è riservato agli operatori accreditati come Amministratori di Sistema. Per richiedere l'abilitazione contatta il referente del backoffice.
                </p>
              </div>
            )}

            {/* SEZIONE 3: FATTURAZIONE & LIQUIDAZIONE VETERINARIA */}
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin') && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1e3a5f] uppercase tracking-wider">Bilancio Liquidazioni & Spese</h3>
                      <p className="text-xs text-slate-500 font-bold">Disborsi per terapie veterinarie, acquisto microchip, cliniche e fornitori esterni convenzionati</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNuovaFatturaModal(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Registra Nuova Spesa
                  </button>
                </div>

                {fatture.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <BadgeInfo className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Nessuna fattura inserita.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                          <th className="p-4">Fornitore / Clinica</th>
                          <th className="p-4">N. Fattura / Protocollo</th>
                          <th className="p-4">Data Emissione</th>
                          <th className="p-4">Stato Pagamento</th>
                          <th className="p-4 text-right">Importo Totale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700 bg-white">
                        {fatture.map((fat) => (
                          <tr key={fat.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <p className="font-extrabold text-slate-800 leading-tight">{fat.fornitore}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-mono text-slate-500 uppercase">{fat.numero_fattura}</p>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-500">
                              {fat.data_emissione ? new Date(fat.data_emissione).toLocaleDateString("it-IT") : "N.D."}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                fat.stato === 'PAGATA' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100 font-black animate-pulse'
                              }`}>
                                {fat.stato}
                              </span>
                            </td>
                            <td className="p-4 text-right font-black text-rose-650">
                              € {(parseFloat(fat.importo_totale) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            </>
            )}
            {showNuovaAdozioneModal && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full flex flex-col mb-8">
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <h3 className="font-black uppercase tracking-wide text-[#1e3a5f] text-sm flex items-center gap-2">
                    <Plus className="h-5 w-5 text-emerald-600" /> Avvia Nuova Istruttoria Pratica Adozione
                  </h3>
                  <button onClick={() => setShowNuovaAdozioneModal(false)} className="text-slate-400 hover:text-rose-600 font-bold bg-slate-50 px-3 py-1 text-[10px] rounded uppercase transition-colors">
                    Chiudi/Annulla
                  </button>
                </div>
                <form onSubmit={handleCreaAdozione} className="p-6 md:p-8 space-y-8 w-full text-left">
                  
                  {/* SEZIONE 1: SCELTA SOGGETTO DA ARCHIVIO */}
                  <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      🐕 1. Soggetto da Affidare / Adottare (da Archivio)
                    </h4>
                    <div>
                      <select
                        required
                        value={formAdozione.registroId}
                        onChange={(e) => setFormAdozione({ ...formAdozione, registroId: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-800 font-extrabold outline-none focus:border-[#1e3a5f] bg-white transition-colors"
                      >
                          <option value="">Scegli l'animale registrato dal canile comunale...</option>
                          {registro
                            .filter((animal) => animal.stato !== 'ADOTTATO')
                            .map((animal) => (
                              <option key={animal.id} value={animal.id}>
                                {animal.nome || `Senza Nome ID #${animal.id}`} ({animal.specie}) - Microchip: {animal.microchip || 'Nessuno'}
                              </option>
                            ))}
                        </select>
                      </div>

                      {formAdozione.registroId && (() => {
                        const sel = registro.find(a => String(a.id) === String(formAdozione.registroId));
                        if (!sel) return null;
                        return (
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-4 items-center">
                            <img 
                              src={sel.fotoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150"} 
                              alt={sel.nome} 
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200" 
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs text-slate-600 w-full font-semibold">
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Nome Animale:</span> <span className="font-bold text-slate-800">{sel.nome || 'Senza Nome'}</span></div>
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Identificativo Microchip:</span> <span className="font-mono text-emerald-700 font-bold">{sel.microchip || 'NESSUNO'}</span></div>
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Specie / Razza:</span> {sel.specie} / {sel.notes || 'Meticcio'}</div>
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Sesso:</span> {sel.sesso}</div>
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Taglia / Colore:</span> {sel.taglia || 'Media'} / {sel.colore || 'N.D.'}</div>
                              <div><span className="text-[9px] font-black uppercase text-slate-400 block">Clinica/Sanitario:</span> {sel.condizioniSanitarie || 'Buono'}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* SEZIONE 2: ANAGRAFICA DELL'ADOTTANTE / DICHIARANTE */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        👤 2. Anagrafica Completa Adottante
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nome e Cognome Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Cognome e Nome dell'adottante"
                            value={formAdozione.nome}
                            onChange={(e) => setFormAdozione({ ...formAdozione, nome: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#1e3a5f]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Codice Fiscale</label>
                          <input
                            type="text"
                            required
                            maxLength={16}
                            placeholder="Minsters CF character"
                            value={formAdozione.cf}
                            onChange={(e) => setFormAdozione({ ...formAdozione, cf: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-[#1e3a5f]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Luogo di Nascita</label>
                          <input
                            type="text"
                            value={formAdozione.nato_a}
                            onChange={(e) => setFormAdozione({ ...formAdozione, nato_a: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#1e3a5f]"
                            placeholder="Esempio: Naro"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Prov. Nascita</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={formAdozione.nato_prov}
                            onChange={(e) => setFormAdozione({ ...formAdozione, nato_prov: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-center outline-none focus:border-[#1e3a5f]"
                            placeholder="AG"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Data di Nascita</label>
                          <input
                            type="date"
                            value={formAdozione.nato_il}
                            onChange={(e) => setFormAdozione({ ...formAdozione, nato_il: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#1e3a5f]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Comune di Residenza</label>
                          <input
                            type="text"
                            value={formAdozione.residente_a}
                            onChange={(e) => setFormAdozione({ ...formAdozione, residente_a: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#1e3a5f]"
                            placeholder="Esempio: Naro"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Prov.</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={formAdozione.residente_prov}
                            onChange={(e) => setFormAdozione({ ...formAdozione, residente_prov: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-center outline-none focus:border-[#1e3a5f]"
                            placeholder="AG"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contatto Telefonico Secondario</label>
                          <input
                            type="tel"
                            value={formAdozione.tel2}
                            onChange={(e) => setFormAdozione({ ...formAdozione, tel2: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1e3a5f]"
                            placeholder="Cellulare/Fisso opzionale"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Via / Piazza d'abitazione</label>
                          <input
                            type="text"
                            value={formAdozione.via}
                            onChange={(e) => setFormAdozione({ ...formAdozione, via: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-[#1e3a5f]"
                            placeholder="Esempio: Corso Vittorio Emanuele"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-mono">N. Civico</label>
                          <input
                            type="text"
                            value={formAdozione.via_num}
                            onChange={(e) => setFormAdozione({ ...formAdozione, via_num: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1e3a5f]"
                            placeholder="Ex. 14"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-mono">Scala / Int.</label>
                          <input
                            type="text"
                            value={formAdozione.via_int_scala}
                            onChange={(e) => setFormAdozione({ ...formAdozione, via_int_scala: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1e3a5f]"
                            placeholder="Scala A int. 3"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Telefono Primario</label>
                          <input
                            type="tel"
                            required
                            value={formAdozione.tel}
                            onChange={(e) => setFormAdozione({ ...formAdozione, tel: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1e3a5f]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Indirizzo Email</label>
                          <input
                            type="email"
                            required
                            value={formAdozione.email}
                            onChange={(e) => setFormAdozione({ ...formAdozione, email: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#1e3a5f]"
                          />
                        </div>
                      </div>

                      {/* DOCUMENTO RICONOSCIMENTO */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-55 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Estremi Documento</label>
                          <select
                            value={formAdozione.documento_tipo}
                            onChange={(e) => setFormAdozione({ ...formAdozione, documento_tipo: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800 font-bold bg-white"
                          >
                            <option value="CARTA_IDENTITA">Carta d'Identità</option>
                            <option value="PASSAPORTO">Passaporto</option>
                            <option value="PATENTE">Patente di Guida</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Numero</label>
                          <input
                            type="text"
                            placeholder="Es: CA02931AA"
                            value={formAdozione.documento_numero}
                            onChange={(e) => setFormAdozione({ ...formAdozione, documento_numero: e.target.value.toUpperCase() })}
                            className="w-full p-2 border border-slate-200 rounded text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Rilasciato da</label>
                          <input
                            type="text"
                            placeholder="Es: Comune di Naro"
                            value={formAdozione.documento_ente}
                            onChange={(e) => setFormAdozione({ ...formAdozione, documento_ente: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Rilasciato il</label>
                          <input
                            type="date"
                            value={formAdozione.documento_data}
                            onChange={(e) => setFormAdozione({ ...formAdozione, documento_data: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEZIONE 3: RICHIESTA & IMPEGNI LEGALI */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        ⚖️ 3. Tipo Richiesta e Vincoli Istituzionali
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-black">Regime della Pratica</label>
                          <select
                            value={formAdozione.richiesta_tipo}
                            onChange={(e) => setFormAdozione({ ...formAdozione, richiesta_tipo: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-extrabold bg-white"
                          >
                            <option value="ADOZIONE_DEFINITIVA">Adozione Definitiva</option>
                            <option value="AFFIDO_TEMPORANEO">Affido Temporaneo (Modulo C)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">In data di decorrenza</label>
                          <input
                            type="date"
                            value={formAdozione.a_partire_da}
                            onChange={(e) => setFormAdozione({ ...formAdozione, a_partire_da: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Luogo Detenzione Soggetto</label>
                          <input
                            type="text"
                            placeholder="Es: Stessa Residenza"
                            value={formAdozione.luogo_detenzione}
                            onChange={(e) => setFormAdozione({ ...formAdozione, luogo_detenzione: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-bold">Impegno Obbligatorio Sterilizzazione</label>
                          <select
                            value={formAdozione.impegno_sterilizzazione}
                            onChange={(e) => setFormAdozione({ ...formAdozione, impegno_sterilizzazione: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value="SI">Sì, mi impegno (obbligatorio per cuccioli)</option>
                            <option value="NO">No (già effettuata dal Comune / Esente)</option>
                            <option value="GIA_EFFETTUATA">Già Effettuata</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contributo Donazione Ente (€)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Libera o Fissa (es: 50)"
                            value={formAdozione.donazione_euro}
                            onChange={(e) => setFormAdozione({ ...formAdozione, donazione_euro: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nota Istruttoria Finale dell'Operatore comunale</label>
                        <textarea
                          placeholder="Fornisci eventuali dettagli sull'alloggio, spazio verde recintato o se l'adottante ha superato il test di pre-affido..."
                          value={formAdozione.note_operatore}
                          onChange={(e) => setFormAdozione({ ...formAdozione, note_operatore: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none h-20 resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNuovaAdozioneModal(false)}
                        className="border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="bg-[#1e3a5f] hover:bg-[#1a3455] text-white font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg active:scale-95"
                      >
                        Salva ed Avvia Pratica
                      </button>
                    </div>
                  </form>
              </div>
            )}

            {/* MODAL EDITING: MODIFICA PRATICA ADOZIONE */}
            {editingAdozione && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-3xl w-full flex flex-col max-h-[90vh]">
                  <div className="bg-[#1e3a5f] px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                    <h3 className="font-extrabold uppercase tracking-wider text-xs flex items-center gap-2">
                       Modifica Pratica Istruttoria Adozione #{editingAdozione.id}
                    </h3>
                    <button onClick={() => setEditingAdozione(null)} className="text-slate-400 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleEditAdoptionSubmit} className="p-6 space-y-5 overflow-y-auto w-full text-left">
                    
                    {/* INFO SOGGETTO */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex gap-4 items-center">
                      <img
                        src={editingAdozione.animal_foto || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150"}
                        alt={editingAdozione.animal_nome}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-lg border border-emerald-100"
                      />
                      <div className="grid grid-cols-2 text-xs font-semibold text-slate-700 w-full gap-x-2">
                        <div><span className="text-[9px] uppercase text-slate-400 block font-bold">Animale:</span> <span className="font-bold text-slate-800">{editingAdozione.animal_nome}</span></div>
                        <div><span className="text-[9px] uppercase text-slate-400 block font-bold">Microchip:</span> <span className="font-mono text-emerald-800">{editingAdozione.animal_microchip || 'ND'}</span></div>
                        <div><span className="text-[9px] uppercase text-slate-400 block font-bold">Specie:</span> {editingAdozione.animal_specie}</div>
                      </div>
                    </div>

                    {/* STATO PRATICA PER GESTIONE OPERATORE */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Azione Amministrativa & Delibera</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Stato Generale</label>
                          <select
                            required
                            value={editingAdozione.stato || "IN_VALUTAZIONE"}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, stato: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-850 bg-white"
                          >
                            <option value="CREATA">CREATA</option>
                            <option value="IN_VALUTAZIONE">IN_VALUTAZIONE</option>
                            <option value="APPROVATA">APPROVATA (Pratica Chiusa)</option>
                            <option value="RIFIUTATA">RIFIUTATA</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Esito Istruttoria Comune</label>
                          <select
                            value={editingAdozione.esito || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, esito: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-850 bg-white"
                          >
                            <option value="">IN SOSPESO / DA DECIDERE</option>
                            <option value="CANDIDATO_IDONEO">IDONEO (Affido idoneo)</option>
                            <option value="NON_SUPPORTATO">CONDIZIONI NON IDONEE (Respinta)</option>
                            <option value="RINUNCIA">RINUNCIA ADOTTANTE</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ANAGRAFICA DETTAGLIATA */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        👤 Anagrafica dell'Adottante
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Cognome e Nome</label>
                          <input
                            type="text"
                            required
                            value={editingAdozione.adottante_nome || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, adottante_nome: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none font-semibold bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Codice Fiscale</label>
                          <input
                            type="text"
                            required
                            value={editingAdozione.adottante_cf || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, adottante_cf: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none font-mono font-bold bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nato a</label>
                          <input
                            type="text"
                            value={editingAdozione.nato_a || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, nato_a: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Prov. Nascita</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={editingAdozione.nato_prov || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, nato_prov: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-center uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nato il</label>
                          <input
                            type="date"
                            value={editingAdozione.nato_il || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, nato_il: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Residente a</label>
                          <input
                            type="text"
                            value={editingAdozione.residente_a || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, residente_a: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Prov.</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={editingAdozione.residente_prov || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, residente_prov: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-center uppercase"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Tel Registrato Secondary</label>
                          <input
                            type="tel"
                            value={editingAdozione.tel2 || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, tel2: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Via / Piazza</label>
                          <input
                            type="text"
                            value={editingAdozione.via || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, via: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Civico</label>
                          <input
                            type="text"
                            value={editingAdozione.via_num || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, via_num: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-mono">Scala / Int.</label>
                          <input
                            type="text"
                            value={editingAdozione.via_int_scala || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, via_int_scala: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Telefono Primario</label>
                          <input
                            type="text"
                            required
                            value={editingAdozione.adottante_tel || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, adottante_tel: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Email Adottante</label>
                          <input
                            type="email"
                            required
                            value={editingAdozione.adottante_email || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, adottante_email: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                          />
                        </div>
                      </div>

                      {/* DOCUMENT */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-55 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Tipo Documento</label>
                          <select
                            value={editingAdozione.documento_tipo}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, documento_tipo: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded text-xs font-bold bg-white"
                          >
                            <option value="CARTA_IDENTITA">Carta d'Identità</option>
                            <option value="PASSAPORTO">Passaporto</option>
                            <option value="PATENTE">Patente di Guida</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Numero</label>
                          <input
                            type="text"
                            value={editingAdozione.documento_numero || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, documento_numero: e.target.value.toUpperCase() })}
                            className="w-full p-2 border border-slate-200 text-xs rounded uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Rilasciato da</label>
                          <input
                            type="text"
                            value={editingAdozione.documento_ente || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, documento_ente: e.target.value })}
                            className="w-full p-2 border border-slate-200 text-xs rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Rilasciato il</label>
                          <input
                            type="date"
                            value={editingAdozione.documento_data || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, documento_data: e.target.value })}
                            className="w-full p-2 border border-slate-200 text-xs rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DICHIARAZIONI ED IMPEGNI */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        ⚖️ Dichiarazioni, Regimi & Sterilizzazione
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Regime Pratica</label>
                          <select
                            value={editingAdozione.richiesta_tipo}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, richiesta_tipo: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value="ADOZIONE_DEFINITIVA">Adozione Definitiva</option>
                            <option value="AFFIDO_TEMPORANEO">Affido Temporaneo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Decorrenza da</label>
                          <input
                            type="date"
                            value={editingAdozione.a_partire_da || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, a_partire_da: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Luogo Detenzione</label>
                          <input
                            type="text"
                            value={editingAdozione.luogo_detenzione || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, luogo_detenzione: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 font-bold">Obbligo Sterilizzazione</label>
                          <select
                            value={editingAdozione.impegno_sterilizzazione}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, impegno_sterilizzazione: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value="SI">Sì, impegnato</option>
                            <option value="NO">No, esente</option>
                            <option value="GIA_EFFETTUATA">Già Effettuata</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Contributo Donatore (€)</label>
                          <input
                            type="number"
                            value={editingAdozione.donazione_euro || ""}
                            onChange={(e) => setEditingAdozione({ ...editingAdozione, donazione_euro: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Note Istruttorie / Relazione Sociale dell'Operatore</label>
                        <textarea
                          value={editingAdozione.note_operatore || ""}
                          onChange={(e) => setEditingAdozione({ ...editingAdozione, note_operatore: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none h-20 resize-none bg-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAdozione(null)}
                        className="border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg active:scale-95"
                      >
                        Salva Pratica
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 2: CRIA STRUTTURA CUSTODIA */}
            {showNuovaStrutturaModal && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-md w-full flex flex-col">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                    <h3 className="font-extrabold uppercase tracking-wider text-sm flex items-center gap-2">
                      <Plus className="h-5 w-5 text-emerald-400" /> Registra Struttura di Custodia
                    </h3>
                    <button onClick={() => setShowNuovaStrutturaModal(false)} className="text-slate-400 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreaStruttura} className="p-6 space-y-4 text-left">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Nome Struttura / Ente Convenzionato</label>
                      <input
                        type="text"
                        required
                        value={formStruttura.nome}
                        onChange={(e) => setFormStruttura({ ...formStruttura, nome: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Tipologia d'Uso</label>
                        <select
                          value={formStruttura.tipo}
                          onChange={(e) => setFormStruttura({ ...formStruttura, tipo: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-emerald-500"
                        >
                          <option value="CANILE">Canile</option>
                          <option value="GATTILE">Gattile</option>
                          <option value="CLINICA_VET">Clinica Veterinaria</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Capacità Max Box</label>
                        <input
                          type="number"
                          required
                          value={formStruttura.capacitaMax}
                          onChange={(e) => setFormStruttura({ ...formStruttura, capacitaMax: parseInt(e.target.value) || 100 })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Indirizzo Sede Operativa</label>
                      <input
                        type="text"
                        required
                        value={formStruttura.indirizzo}
                        onChange={(e) => setFormStruttura({ ...formStruttura, indirizzo: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Telefono / Referente Reperibile</label>
                      <input
                        type="text"
                        value={formStruttura.telefono}
                        onChange={(e) => setFormStruttura({ ...formStruttura, telefono: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNuovaStrutturaModal(false)}
                        className="border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg"
                      >
                        Salva Struttura
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 3: REGISTRAZIONE SPESE VETERINARIO & FATTURE */}
            {showNuovaFatturaModal && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-md w-full flex flex-col">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                    <h3 className="font-extrabold uppercase tracking-wider text-sm flex items-center gap-2">
                      <Plus className="h-5 w-5 text-rose-400" /> Registra Nuova Fattura Spese
                    </h3>
                    <button onClick={() => setShowNuovaFatturaModal(false)} className="text-slate-400 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreaFattura} className="p-6 space-y-4 text-left">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Causale / Fornitore / Studio Veterinario</label>
                      <input
                        type="text"
                        required
                        placeholder="Es. Clinica Vet San Leone, Acquisto Microchip ASP"
                        value={formFattura.fornitore}
                        onChange={(e) => setFormFattura({ ...formFattura, fornitore: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">N. Fattura / Lotto</label>
                        <input
                          type="text"
                          required
                          value={formFattura.numero}
                          onChange={(e) => setFormFattura({ ...formFattura, numero: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Data Spesa</label>
                        <input
                          type="date"
                          required
                          value={formFattura.data}
                          onChange={(e) => setFormFattura({ ...formFattura, data: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Importo Monetario (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formFattura.importo}
                          onChange={(e) => setFormFattura({ ...formFattura, importo: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-[#1e3a5f] outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Stato Liquidazione</label>
                        <select
                          value={formFattura.stato}
                          onChange={(e) => setFormFattura({ ...formFattura, stato: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-rose-500"
                        >
                          <option value="DA_PAGARE">Da Pagare</option>
                          <option value="PAGATA">Liquidato / Pagato</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNuovaFatturaModal(false)}
                        className="border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg"
                      >
                        Salva Spesa
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 4: CREA CONVENZIONE */}
            {showNuovaConvenzioneModal && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-w-md w-full flex flex-col">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                    <h3 className="font-extrabold uppercase tracking-wider text-sm flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-400" /> Attiva Convenzione Istituzionale
                    </h3>
                    <button onClick={() => setShowNuovaConvenzioneModal(false)} className="text-slate-400 hover:text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreaConvenzione} className="p-6 space-y-4 text-left">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Seleziona Partner / Struttura di Destinazione</label>
                      <select
                        required
                        value={formConvenzione.strutturaId}
                        onChange={(e) => setFormConvenzione({ ...formConvenzione, strutturaId: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none focus:border-blue-500 font-bold"
                      >
                        <option value="">Seleziona Ente dal database...</option>
                        {strutture.map((s) => (
                          <option key={s.id} value={s.id}>{s.nome} ({s.tipo})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Tipologia d'Accordo / Servizio Offerto</label>
                      <input
                        type="text"
                        required
                        placeholder="Es. Servizio di Sterilizzazione e Accalappiatura 24h"
                        value={formConvenzione.tipoServizio}
                        onChange={(e) => setFormConvenzione({ ...formConvenzione, tipoServizio: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Data Inizio Accordo</label>
                        <input
                          type="date"
                          required
                          value={formConvenzione.dataInizio}
                          onChange={(e) => setFormConvenzione({ ...formConvenzione, dataInizio: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Data Fine Accordo</label>
                        <input
                          type="date"
                          required
                          value={formConvenzione.dataFine}
                          onChange={(e) => setFormConvenzione({ ...formConvenzione, dataFine: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Dote Annua Accantonata (€)</label>
                        <input
                          type="number"
                          required
                          value={formConvenzione.importoAnnuo}
                          onChange={(e) => setFormConvenzione({ ...formConvenzione, importoAnnuo: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Stato Convenzione</label>
                        <select
                          value={formConvenzione.stato}
                          onChange={(e) => setFormConvenzione({ ...formConvenzione, stato: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
                        >
                          <option value="ATTIVA">Attiva</option>
                          <option value="CONCLUSA">Conclusa</option>
                          <option value="SOCIOSANITARIA">Accordo Socio-Sanitario Speciale</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNuovaConvenzioneModal(false)}
                        className="border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                      >
                        Annulla
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg"
                      >
                        Salva Accordo
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        ) : activeTab === 'gestione-operatori' ? (
          <GestioneOperatoriTab currentUser={currentUser} />
        ) : null}
      </div>
    </div>
  </div>
);
}
