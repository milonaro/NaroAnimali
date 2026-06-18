import { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Search, Clock, CheckCircle2, ChevronRight, ChevronDown, ArrowLeft, Loader2, MapPin, Activity, HelpCircle, Info, Download, BarChart3, Maximize2, Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Lightbox from '../components/ui/Lightbox';

interface Report {
  code: string;
  status: 'CREATA' | 'ASSEGNATA' | 'IN_INTERVENTO' | 'CHIUSA';
  date: string;
  desc: string;
  location?: string;
  specie?: string;
  image?: string;
}

const SPID_PROVIDERS = [
  { id: 'poste', name: 'PosteID', logoText: 'Poste id', colorBg: 'bg-[#ffcc00] text-[#003366] border-[#ffcc00]' },
  { id: 'aruba', name: 'ArubaID', logoText: 'Aruba id', colorBg: 'bg-[#ef6b00] text-white border-[#f37c1d]' },
  { id: 'infocert', name: 'InfoCert ID', logoText: 'InfoCert ID', colorBg: 'bg-[#005c99] text-white border-[#0070b8]' },
  { id: 'lepida', name: 'Lepida', logoText: 'Lepida', colorBg: 'bg-[#e21b1b] text-white border-[#eb3030]' },
  { id: 'namirial', name: 'Namirial ID', logoText: 'Namirial ID', colorBg: 'bg-[#3b0066] text-white border-[#4d0085]' },
  { id: 'tim', name: 'TIM id', logoText: 'TIM id', colorBg: 'bg-[#002e7a] text-white border-[#003ca3]' },
  { id: 'sielte', name: 'SIELTE id', logoText: 'SIELTE id', colorBg: 'bg-[#008fcc] text-white border-[#00a3e8]' },
  { id: 'spiditalia', name: 'SpidItalia', logoText: 'SpidItalia', colorBg: 'bg-[#333399] text-white border-[#4040a1]' },
  { id: 'intesi', name: 'INTESI GROUP', logoText: 'Intesi Group', colorBg: 'bg-[#1a1a1a] text-white border-[#2b2b2b]' },
  { id: 'teamsystem', name: 'TeamSystem ID', logoText: 'TeamSystem ID', colorBg: 'bg-[#00a896] text-white border-[#05c4ae]' },
  { id: 'infocamere', name: 'InfoCamere', logoText: 'InfoCamere', colorBg: 'bg-[#3d7a5a] text-white border-[#4d946e]' },
  { id: 'etnaid', name: 'etnaID', logoText: 'etnaID', colorBg: 'bg-[#f4511e] text-white border-[#ff6d3f]' }
];

export default function MiaArea() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: dashboard
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ''
  });

  const [reports, setReports] = useState<Report[]>([]);
  
  // --- NUOVI STATI ANAGRAFE CANINA ---
  const [activeTab, setActiveTab] = useState<'segnalazioni' | 'anagrafe' | 'profilo'>('segnalazioni');
  const [animals, setAnimals] = useState<any[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [regForm, setRegForm] = useState({
    nome: '',
    specie: 'Cane',
    sesso: 'M',
    taglia: 'Media',
    colore: '',
    microchip: '',
    condizioniSanitarie: 'Sano'
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // --- NUOVI STATI PROFILO & SPID PER LEGGE ---
  const [loginMethod, setLoginMethod] = useState<'otp' | 'spid'>('otp');
  const [isSpidDropdownOpen, setIsSpidDropdownOpen] = useState(false);
  const [selectedSpidProvider, setSelectedSpidProvider] = useState<string | null>(null);
  const [showSpidModal, setShowSpidModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Simulated SPID Credentials Form
  const [spidForm, setSpidForm] = useState({
    email: '',
    username: '',
    password: '',
    nome: '',
    cognome: '',
    codiceFiscale: '',
    telefono: '',
    indirizzo: '',
    comuneResidenza: 'Naro',
    consensoDati: true
  });

  useEffect(() => {
    checkAuth();
    
    // Sync tab switching requested from Header dropdown profile buttons
    const handleTabChange = (e: any) => {
      const targetTab = e.detail;
      setActiveTab(targetTab);
    };

    const handleLogoutEvent = () => {
      setEmail('');
      setOtp('');
      setStep(1);
      setProfile(null);
    };

    window.addEventListener("citizen-tab-change", handleTabChange);
    window.addEventListener("citizen-logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("citizen-tab-change", handleTabChange);
      window.removeEventListener("citizen-logout", handleLogoutEvent);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/otp/me");
      if (res.ok) {
        const data = await res.json();
        setEmail(data.user.email);
        setProfile(data.profile);
        await Promise.all([
          loadReports(data.user.email),
          loadAnimals()
        ]);
        setStep(3);
      }
    } catch (e) {
      // Not authenticated
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/otp/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileSuccess(true);
        // Refresh profile data
        await checkAuth();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error || "Impossibile aggiornare il profilo cittadino.");
      }
    } catch (err) {
      setError("Errore durante il salvataggio dei dati.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSpidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spidForm.email || !spidForm.codiceFiscale) {
      setError("Email e Codice Fiscale sono richiesti ai fini SPID.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/spid-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedSpidProvider,
          email: spidForm.email,
          nome: spidForm.nome,
          cognome: spidForm.cognome,
          codice_fiscale: spidForm.codiceFiscale,
          telefono: spidForm.telefono,
          indirizzo: spidForm.indirizzo,
          comune_residenza: spidForm.comuneResidenza
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore login SPID.");
      
      setShowSpidModal(false);
      setSelectedSpidProvider(null);
      setIsSpidDropdownOpen(false);
      
      setEmail(spidForm.email);
      await checkAuth();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnimals = async () => {
    setLoadingAnimals(true);
    try {
      const res = await fetch("/api/registro/my-animals");
      if (res.ok) {
        const data = await res.json();
        setAnimals(data);
      }
    } catch (e) {
      console.error("Errore caricamento animali:", e);
    } finally {
      setLoadingAnimals(false);
    }
  };

  const loadReports = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/segnalazioni?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: Report[] = data.map((item: any) => ({
          code: item.codice_tracking || item.codiceTracking || 'N/A',
          status: item.stato as Report['status'],
          date: new Date(item.created_at || item.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
          desc: item.descrizione,
          location: item.indirizzo,
          specie: item.specie,
          image: item.foto_url || item.fotoUrl || undefined
        }));
        setReports(mapped);
        setStep(3);
      } else {
        throw new Error("Impossibile caricare le segnalazioni.");
      }
    } catch (e: any) {
      setError(e.message || "Errore di connessione o caricamento dei dati.");
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'invio dell'OTP");
      if (data.debugOtp) {
        setInfo(`SMTP non configurato. Usa il codice di test: ${data.debugOtp}`);
      }
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP non valido");
      
      await Promise.all([
        loadReports(email),
        loadAnimals()
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/otp/logout", { method: "POST" });
    } catch (e) {}
    setStep(1);
    setEmail('');
    setOtp('');
    setReports([]);
    setAnimals([]);
    setSelectedReport(null);
    setActiveTab('segnalazioni');
  };

  const handleRegisterAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    setRegError(null);
    setRegSuccess(false);

    // Validazione stringente del Codice Microchip a 15 cifre (requisito di legge)
    if (!/^\d{15}$/.test(regForm.microchip)) {
      setRegError("Il codice microchip inserito non è valido. Per legge, deve contenere esattamente 15 cifre numeriche.");
      setSubmittingReg(false);
      return;
    }

    try {
      const res = await fetch("/api/registro/my-animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossibile registrare l'animale.");
      }
      setRegSuccess(true);
      setRegForm({
        nome: '',
        specie: 'Cane',
        sesso: 'M',
        taglia: 'Media',
        colore: '',
        microchip: '',
        condizioniSanitarie: 'Sano'
      });
      await loadAnimals();
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setSubmittingReg(false);
    }
  };

  const generateAnimalCertificate = (animal: any) => {
    const doc = new jsPDF();
    
    // Sfondo Header
    doc.setFillColor(16, 27, 58); // #101b3a
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('COMUNE DI NARO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('SETTORE BENESSERE ANIMALE - UFFICIO ANAGRAFE CANINA COMUNALE', 105, 32, { align: 'center' });
    
    // Titolo Certificato
    doc.setTextColor(30, 58, 95); // #1e3a5f
    doc.setFontSize(14);
    doc.text('ATTESTATO DI RICHIESTA ISCRIZIONE ANAGRAFICA', 105, 60, { align: 'center' });
    
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 68, 190, 68);
    
    // Tabella delle proprietà
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    let currentY = 82;
    const addRow = (label: string, value: string) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(label, 30, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.text(value, 95, currentY);
      currentY += 10;
    };

    addRow('Codice Microchip (15 cifre):', animal.microchip);
    addRow('Nome Animale:', animal.nome);
    addRow('Specie / Tipo:', animal.specie === 'Cane' ? 'CANE (Canis lupus familiaris)' : animal.specie.toUpperCase());
    addRow('Sesso:', animal.sesso === 'M' ? 'MASCHIO' : animal.sesso === 'F' ? 'FEMMINA' : animal.sesso);
    addRow('Taglia dichiarata:', animal.taglia);
    addRow('Colore / Mantello:', animal.colore || 'N/D');
    addRow('Stato Sanitario:', animal.condizioni_sanitarie || 'Normale');
    addRow('Proprietario (E-mail):', email);
    addRow('Stato d\'Ufficio:', animal.stato === 'IN_ATTESA' ? 'IN ATTESA DI APPROVAZIONE PROTOCOLLO' : 'REGISTRATO CON SUCCESSO');
    addRow('Data della richiesta:', new Date(animal.data_registrazione || animal.dataRegistrazione).toLocaleDateString('it-IT'));

    // Bordo finale
    doc.line(20, currentY + 5, 190, currentY + 5);

    // footer attestato
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Questa ricevuta attesta l\'invio telematico della pratica di iscrizione all\'Anagrafe Canina.', 105, currentY + 15, { align: 'center' });
    doc.text('Il Comune verificherà la conformità del codice microchip e la documentazione allegata.', 105, currentY + 20, { align: 'center' });
    doc.text('Generato in automatico tramite piattaforma AnimalHub PA - ID: ' + animal.id, 105, currentY + 25, { align: 'center' });

    doc.save(`Attestato_Iscrizione_${animal.microchip}.pdf`);
  };

  const generatePDF = (report: Report) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 27, 58); // #101b3a
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('AnimalHub PA - Comune di Naro', 20, 25);
    
    // Receipt Info
    doc.setTextColor(30, 58, 95); // #1e3a5f
    doc.setFontSize(10);
    doc.text(`RICEVUTA DI SEGNALAZIONE PROTOCOLLATA OGGI: ${new Date().toLocaleDateString('it-IT')}`, 20, 55);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 60, 190, 60);
    
    // Data
    doc.setFontSize(14);
    doc.text(`Codice Pratica: ${report.code}`, 20, 75);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Dettagli Segnalazione:', 20, 90);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`• Descrizione: ${report.desc}`, 25, 100);
    doc.text(`• Specie: ${report.specie}`, 25, 110);
    doc.text(`• Località: ${report.location}`, 25, 120);
    doc.text(`• Data Apertura: ${report.date}`, 25, 130);
    doc.text(`• Stato Attuale: ${report.status}`, 25, 140);
    
    // Footer
    doc.setDrawColor(240, 240, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 160, 170, 30, 'F');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Questa ricevuta ha valore puramente informativo delle attività di protocollo digitale.', 30, 172);
    doc.text('Comune di Naro (AG) - Servizio Benessere Animale.', 30, 180);

    doc.save(`Ricevuta_${report.code}.pdf`);
  };

  const getStatusStep = (status: Report['status']) => {
    switch (status) {
      case 'CREATA': return 1;
      case 'ASSEGNATA': return 2;
      case 'IN_INTERVENTO': return 3;
      case 'CHIUSA': return 4;
      default: return 1;
    }
  };

  const timelineSteps = [
    { id: 1, label: 'Creata', desc: 'Segnalazione registrata nel sistema protocollato' },
    { id: 2, label: 'Assegnata', desc: 'Operatore del Comune incaricato del caso' },
    { id: 3, label: 'In Intervento', desc: 'Squadra operativa o veterinaria sul posto' },
    { id: 4, label: 'Chiusa', desc: 'Intervento completato con esito positivo' }
  ];

  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen" style={{ borderWidth: '0px', paddingTop: '110px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Modern Header block */}
        {step !== 3 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Fascicolo Elettronico del Cittadino</span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">Mia Area Riservata</h1>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                  Verifica lo stato di avanzamento delle tue segnalazioni di soccorso a <span className="text-[#101b3a] font-extrabold">Naro</span>.
                </p>
              </div>
              
              {/* Quick stats / safety indicators */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 border border-slate-200/60 rounded-xl flex items-center gap-2 h-9 bg-slate-50/50">
                  <span className="w-2 h-2 rounded-full bg-[#15803d]" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Accesso Sicuro OTP / SPID</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="max-w-md mx-auto w-full pt-12 text-left"
              >
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                  {/* METODO DI ACCESSO SELECTOR */}
                  <div className="flex border-b border-slate-100 p-0.5 gap-2 bg-slate-50 rounded-xl">
                    <button
                      onClick={() => setLoginMethod('otp')}
                      className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                        loginMethod === 'otp'
                          ? 'bg-[#15803d] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔑 ACCESSO OTP
                    </button>
                    <button
                      onClick={() => setLoginMethod('spid')}
                      className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                        loginMethod === 'spid'
                          ? 'bg-[#0066cc] text-white shadow-sm'
                          : 'text-slate-500 hover:text-[#0066cc]'
                      }`}
                    >
                      🇮🇹 ACCESSO SPID
                    </button>
                  </div>

                  {loginMethod === 'otp' ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <Mail className="text-[#15803d] h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-black text-[#101b3a] tracking-tight">Verifica la tua Identità</h2>
                        <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Inserisci la tua email per ricevere un codice provvisorio.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Indirizzo Email</label>
                        <input
                          type="email"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-300 text-sm"
                          placeholder="la.tua@email.it"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                      <button
                        disabled={!email || loading}
                        onClick={handleSendOTP}
                        className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-[#166534] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Invia Codice Accesso &rarr;</>}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <ShieldCheck className="text-[#0066cc] h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-black text-[#101b3a] tracking-tight">Accesso Certificato SPID</h2>
                        <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Accedi in modo sicuro tramite il tuo gestore d'identità.</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="spid_professional"
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 border-slate-300"
                        />
                        <label htmlFor="spid_professional" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none">
                          Utilizza SPID professionale
                        </label>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setIsSpidDropdownOpen(!isSpidDropdownOpen)}
                          type="button"
                          className="w-full bg-[#0066cc] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm hover:bg-[#0052a3] transition-all flex items-center justify-center gap-3 cursor-pointer"
                        >
                          <span className="bg-white text-[#0066cc] px-1.5 py-0.5 rounded font-black text-[9px] tracking-tight uppercase">spid</span>
                          <span>Entra con SPID</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {isSpidDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-150 p-3.5 z-[200] grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                            {SPID_PROVIDERS.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedSpidProvider(p.name);
                                  // Seed with a default demo credential that passes valid CF requirements
                                  setSpidForm({
                                    email: 'mario.rossi@poste.it',
                                    username: 'mario.rossi.80',
                                    password: '••••••••••••',
                                    nome: 'Mario',
                                    cognome: 'Rossi',
                                    codiceFiscale: 'RSSMRA80A01H501U',
                                    telefono: '3471234567',
                                    indirizzo: 'Via Vittorio Emanuele 12',
                                    comuneResidenza: 'Naro',
                                    consensoDati: true
                                  });
                                  setShowSpidModal(true);
                                  setIsSpidDropdownOpen(false);
                                }}
                                className={`flex items-center justify-center p-3 rounded-xl border font-black text-[10px] tracking-wide uppercase transition-all shadow-xs hover:scale-[1.03] cursor-pointer ${p.colorBg}`}
                              >
                                {p.logoText}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-8 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Servizio di Sicurezza Certificato AGID
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -50 }} 
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="max-w-md mx-auto w-full pt-12"
              >
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-8">
                  <div className="text-center">
                    <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <ShieldCheck className="text-[#15803d] h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Verifica OTP</h2>
                    <p className="text-slate-500 text-xs font-bold mt-1.5 uppercase tracking-wide">Inserisci il codice temporaneo inviato alla tua casella mail.</p>
                  </div>

                  {info && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-bold text-center">
                      {info}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center block">Codice Monouso</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-3xl font-black tracking-[0.4em] text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all placeholder:text-slate-200 text-sm"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <button
                    disabled={otp.length !== 6 || loading}
                    onClick={handleVerifyOTP}
                    className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Accedi al mio Dossier'}
                  </button>
                  <button onClick={() => setStep(1)} className="w-full text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#101b3a] transition-colors cursor-pointer bg-transparent border-none outline-none">Modifica Email</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="space-y-6 w-full"
              >
                <AnimatePresence mode="wait">
                  {!selectedReport ? (
                    <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#15803d] mb-1.5 block">Identificativo Digitale</span>
                          <h1 className="text-xl sm:text-2xl font-black text-[#101b3a] tracking-tight">Il tuo Fascicolo del Cittadino</h1>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs text-slate-500 font-semibold">Utenza attiva: <span className="text-[#101b3a] font-extrabold">{email}</span></p>
                          </div>
                        </div>
                        <button onClick={handleLogout} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-red-600 transition-all py-2.5 px-5 bg-slate-50 border border-slate-200 hover:border-red-200 rounded-xl cursor-pointer">Esci Sessione</button>
                      </div>

                      {/* TABS SELECTOR */}
                      <div className="flex border-b border-slate-200 gap-6">
                        <button
                          onClick={() => setActiveTab('segnalazioni')}
                          className={`pb-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'segnalazioni'
                              ? 'border-[#15803d] text-[#15803d]'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Segnalazioni Soccorsi
                        </button>
                        <button
                          onClick={() => setActiveTab('anagrafe')}
                          className={`pb-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'anagrafe'
                              ? 'border-[#15803d] text-[#15803d]'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          I Miei Animali (Anagrafe Canina)
                        </button>
                        <button
                          onClick={() => setActiveTab('profilo')}
                          className={`pb-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            activeTab === 'profilo'
                              ? 'border-[#15803d] text-[#15803d]'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Profilo Cittadino
                        </button>
                      </div>

                      {activeTab === 'segnalazioni' ? (
                        <>
                          {/* Chart Section */}
                          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <BarChart3 className="h-6 w-6" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold text-[#1e3a5f]">Statistiche Segnalazioni</h2>
                                <p className="text-gray-400 text-sm font-medium">Andamento degli ultimi 6 mesi nel territorio di Naro</p>
                              </div>
                            </div>
                            
                            <div className="h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                  { name: 'Dic', total: 12 },
                                  { name: 'Gen', total: 18 },
                                  { name: 'Feb', total: 14 },
                                  { name: 'Mar', total: 22 },
                                  { name: 'Apr', total: 28 },
                                  { name: 'Mag', total: 25 },
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                  />
                                  <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                  />
                                  <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="bg-[#101b3a] p-4 rounded-lg shadow-2xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{payload[0].payload.name}</p>
                                            <p className="text-xl font-bold text-white">{payload[0].value} <span className="text-xs font-medium text-emerald-400">Segnalazioni</span></p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Bar 
                                    dataKey="total" 
                                    radius={[8, 8, 0, 0]} 
                                    barSize={40}
                                  >
                                    {[1, 2, 3, 4, 5, 6].map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 5 ? '#15803d' : '#e2e8f0'} className="hover:fill-blue-500 transition-colors" />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 sm:gap-8">
                            {reports.map((item, i) => (
                              <div 
                                key={i} 
                                onClick={() => setSelectedReport(item)}
                                className="bg-white border-2 border-transparent p-4 sm:p-10 rounded-xl shadow-md sm:shadow-xl hover:shadow-2xl hover:border-[#15803d]/20 transition-all cursor-pointer group relative overflow-hidden"
                              >
                                 {/* Status Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-2 ${
                                  item.status === 'CHIUSA' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`} />

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-4 mb-3 sm:mb-8">
                                  <span className="bg-gray-50 text-[#1e3a5f] px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border border-gray-100">{item.code}</span>
                                  <span className={`px-1.5 py-0.5 sm:px-4 sm:py-1.5 rounded-md sm:rounded-full text-[7px] sm:text-[9px] font-bold uppercase tracking-widest ${
                                    item.status === 'CHIUSA' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {item.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <h3 className="text-xs sm:text-2xl font-bold text-[#1e3a5f] mb-1 sm:mb-4 leading-tight group-hover:text-[#15803d] transition-colors line-clamp-2 sm:line-clamp-none">{item.desc}</h3>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-6">
                                   <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-semibold text-gray-400">
                                     <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> {item.date}
                                   </div>
                                   <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-semibold text-gray-400">
                                     <MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> {item.specie}
                                   </div>
                                </div>
                                <div className="mt-3 sm:mt-10 pt-3 sm:pt-8 border-t border-gray-50 flex justify-between items-center text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-[#15803d] group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform">
                                  <span>Gestione Pratica</span> <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-emerald-50/30 rounded-lg p-24 text-center border-4 border-dashed border-emerald-100">
                            <Search className="h-16 w-16 text-emerald-200 mx-auto mb-8" />
                            <h3 className="text-xl font-bold text-[#1e3a5f]">Nessun altro record</h3>
                            <p className="text-gray-500 font-medium max-w-xs mx-auto mt-4 px-8 leading-relaxed">Il tuo archivio storico mostra solo le attività recenti associate a questa utenza.</p>
                          </div>
                        </>
                      ) : activeTab === 'anagrafe' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start select-none">
                          {/* Modulo Registrazione Animale */}
                          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-fit text-left">
                            <h3 className="text-lg font-black text-[#101b3a] tracking-tight mb-1 flex items-center gap-2">
                              <Plus className="h-5 w-5 text-[#15803d]" /> Nuova Registrazione
                            </h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6 leading-tight">
                              Iscrivi il tuo animale all'Anagrafe Canina Comunale
                            </p>

                            {!profile?.nome || !profile?.codice_fiscale || !profile?.telefono ? (
                              <div className="space-y-4">
                                <div className="flex gap-2.5 text-amber-805 bg-amber-50 rounded-xl p-4.5 border border-amber-205">
                                  <Info className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider block text-amber-800">Dati Demografici Mancanti</span>
                                    <p className="text-[11px] leading-relaxed mt-1 font-semibold text-slate-650">
                                      Per legge (D.P.R. 445/2000), le istanze inviate alla Pubblica Amministrazione devono essere associate a dati anagrafici certificati e ad un recapito telefonico valido.
                                    </p>
                                  </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Completa il tuo <span className="text-[#15803d] underline">Profilo Cittadino</span> con Nome, Cognome, Codice Fiscale e Telefono prima di inoltrare la pratica.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('profilo')}
                                  className="w-full bg-[#15803d] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer hover:bg-[#116430] transition-all"
                                >
                                  Completa Profilo &rarr;
                                </button>
                              </div>
                            ) : (
                              <>
                                {regError && (
                                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
                                    {regError}
                                  </div>
                                )}

                                {regSuccess && (
                                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
                                    Richiesta d'iscrizione protocollata con successo! L'ufficio comunale verificherà la pratica a breve. Puoi già scaricare l'attestato provvisorio dalla lista a fianco.
                                  </div>
                                )}

                            <form onSubmit={handleRegisterAnimal} className="space-y-4">
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Nome Animale</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Es. Argo"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all"
                                  value={regForm.nome}
                                  onChange={(e) => setRegForm({...regForm, nome: e.target.value})}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Specie</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all text-left"
                                    value={regForm.specie}
                                    onChange={(e) => setRegForm({...regForm, specie: e.target.value})}
                                  >
                                    <option value="Cane">Cane 🐶</option>
                                    <option value="Gatto">Gatto 🐱</option>
                                    <option value="Altro">Altro soggetti</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Sesso</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all text-left"
                                    value={regForm.sesso}
                                    onChange={(e) => setRegForm({...regForm, sesso: e.target.value})}
                                  >
                                    <option value="M">Maschio</option>
                                    <option value="F">Femmina</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Taglia</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all"
                                    value={regForm.taglia}
                                    onChange={(e) => setRegForm({...regForm, taglia: e.target.value})}
                                  >
                                    <option value="Piccola">Piccola</option>
                                    <option value="Media">Media</option>
                                    <option value="Grande">Grande</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Mantello (Colore)</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Es. Fulvo, Nero pezzato"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all"
                                    value={regForm.colore}
                                    onChange={(e) => setRegForm({...regForm, colore: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Codice Microchip (15 Cifre)</label>
                                <input
                                  type="text"
                                  maxLength={15}
                                  required
                                  placeholder="Es. 380260000123456"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all"
                                  value={regForm.microchip}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setRegForm({...regForm, microchip: val});
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 mt-1 font-semibold block uppercase leading-tight">
                                  Codice obbligatorio per legge inserito dal veterinario abilitato.
                                </span>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Stato Sanitario</label>
                                <input
                                  type="text"
                                  placeholder="Es. Sano, sterilizzato"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none text-sm transition-all"
                                  value={regForm.condizioniSanitarie}
                                  onChange={(e) => setRegForm({...regForm, condizioniSanitarie: e.target.value})}
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={submittingReg || regForm.microchip.length !== 15}
                                className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-black uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {submittingReg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia Pratica Iscrizione"}
                              </button>
                            </form>
                              </>
                            )}
                          </div>

                          {/* Lista dei Propri Animali */}
                          <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                              <h3 className="text-lg font-black text-[#101b3a] tracking-tight mb-1 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-[#15803d]" /> I tuoi Animali Iscritti
                              </h3>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6">
                                Animali d'affezione registrati a tuo nome
                              </p>

                              {loadingAnimals ? (
                                <div className="py-12 text-center text-slate-400">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#15803d]" />
                                  <span className="text-xs font-bold uppercase tracking-wider">Caricamento in corso...</span>
                                </div>
                              ) : animals.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-100 rounded-xl p-12 text-center">
                                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Info className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <h4 className="text-sm font-bold text-[#101b3a] mb-1">Nessun animale registrato</h4>
                                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                    Invia la tua prima richiesta con il modulo a sinistra per associare la tua utenza a un microchip protocollato.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {animals.map((anim, idx) => (
                                    <div 
                                      key={anim.id || idx} 
                                      className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
                                    >
                                      {/* Barretta di stato colorata */}
                                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                                        anim.stato === 'IN_ATTESA' ? 'bg-amber-400' : 'bg-emerald-500'
                                      }`} />

                                      <div className="pl-3 space-y-1 text-left">
                                        <div className="flex items-center gap-3">
                                          <h4 className="text-base font-black text-[#101b3a] leading-none mb-0.5">{anim.nome}</h4>
                                          <span className="bg-white border border-slate-200 text-[#101b3a] text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                                            {anim.specie === 'Cane' ? '🐶 CANE' : anim.specie === 'Gatto' ? '🐱 GATTO' : `🐾 ${anim.specie.toUpperCase()}`}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                          Microchip: <span className="font-mono text-xs font-bold text-slate-600 tracking-wider font-semibold">{anim.microchip}</span>
                                        </p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1.5">
                                          <span>Sesso: <strong>{anim.sesso === 'M' ? 'M' : 'F'}</strong></span>
                                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                          <span>Taglia: <strong>{anim.taglia}</strong></span>
                                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                          <span>Mantello: <strong>{anim.colore}</strong></span>
                                        </div>
                                      </div>

                                      <div className="flex sm:flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                          anim.stato === 'IN_ATTESA'
                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        }`}>
                                          {anim.stato === 'IN_ATTESA' ? "In attesa d'ufficio" : "Iscritto all'Anagrafe"}
                                        </span>
                                        <button 
                                          onClick={() => generateAnimalCertificate(anim)}
                                          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-emerald-200 text-[#101b3a] hover:text-[#15803d] transition-all px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm cursor-pointer ml-auto sm:ml-0"
                                        >
                                          <Download className="h-3.5 w-3.5" /> Scarica Attestato
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm space-y-8 text-left animate-fadeIn">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                            <div>
                              <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Dati Anagrafici Certificati</h2>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Gestisci la tua identità e i dati anagrafici richiesti per legge.</p>
                            </div>
                            {profile?.is_spid_verified === 1 ? (
                              <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2.5 rounded-xl border border-blue-200 text-xs font-black uppercase tracking-wider">
                                🔒 Connesso con SPID ({profile.identity_provider})
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-amber-50 text-amber-805 px-4 py-2.5 rounded-xl border border-amber-200 text-xs font-black uppercase tracking-wider">
                                📧 Connesso con OTP (Email)
                              </div>
                            )}
                          </div>

                          {profileSuccess && (
                            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs font-black uppercase tracking-wide leading-relaxed">
                              ✅ Profilo aggiornato correttamente! Tutti i dati giuridici sono stati allineati.
                            </div>
                          )}

                          <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome</label>
                                <input
                                  type="text"
                                  required
                                  disabled={profile?.is_spid_verified === 1}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm disabled:opacity-60"
                                  value={profile?.nome || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, nome: e.target.value } : { nome: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cognome</label>
                                <input
                                  type="text"
                                  required
                                  disabled={profile?.is_spid_verified === 1}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm disabled:opacity-60"
                                  value={profile?.cognome || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, cognome: e.target.value } : { cognome: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-[#15803d] flex items-center gap-1.5 font-bold font-black">
                                  Codice Fiscale <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black">LEGGE</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  disabled={profile?.is_spid_verified === 1}
                                  maxLength={16}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm uppercase disabled:opacity-60 font-mono"
                                  placeholder="RSSMRA80A01H501U"
                                  value={profile?.codice_fiscale || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, codice_fiscale: e.target.value.toUpperCase() } : { codice_fiscale: e.target.value.toUpperCase() })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Telefono Cellulare</label>
                                <input
                                  type="text"
                                  required
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm"
                                  value={profile?.telefono || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, telefono: e.target.value } : { telefono: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Indirizzo di Residenza</label>
                                <input
                                  type="text"
                                  required
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm"
                                  placeholder="Via Vittorio Emanuele, 12"
                                  value={profile?.indirizzo || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, indirizzo: e.target.value } : { indirizzo: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comune di Residenza</label>
                                <input
                                  type="text"
                                  required
                                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3.5 font-bold text-[#101b3a] focus:bg-white focus:border-[#15803d] outline-none transition-all text-sm"
                                  value={profile?.comune_residenza || ''}
                                  onChange={(e) => setProfile(profile ? { ...profile, comune_residenza: e.target.value } : { comune_residenza: e.target.value })}
                                />
                              </div>
                            </div>

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed pt-2">
                              ℹ️ Ai sensi del D.P.R. 445/2000 l'utente dichiara sotto la propria personale responsabilità che le informazioni fornite corrispondono al vero. I dati contrassegnati da SPID sono certificati e non modificabili autonomamente.
                            </p>

                            <div className="flex justify-end pt-4 gap-4">
                              <button
                                type="button"
                                onClick={() => setActiveTab('segnalazioni')}
                                className="px-6 py-3 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                              >
                                Torna alla Dashboard
                              </button>
                              <button
                                type="submit"
                                disabled={savingProfile}
                                className="bg-[#15803d] hover:bg-[#166534] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {savingProfile ? 'Salvataggio in Corso...' : 'Salva Profilo'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <button 
                      onClick={() => setSelectedReport(null)}
                      className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-[#15803d] transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-white border border-gray-100 group-hover:border-[#15803d] transition-colors"><ArrowLeft className="h-4 w-4" /></div> Torna alla lista
                    </button>
                    <div className="flex gap-3">
                       <button 
                         onClick={() => selectedReport && generatePDF(selectedReport)}
                         className="flex items-center gap-2 px-4 py-2 bg-[#15803d] text-white rounded-lg hover:bg-[#166534] transition-all shadow-lg shadow-[#15803d]/20 text-[10px] font-bold uppercase tracking-widest"
                       >
                         <Download className="h-4 w-4" /> Stampa PDF
                       </button>
                       <button className="p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><Activity className="h-5 w-5 text-gray-400" /></button>
                       <button className="p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><HelpCircle className="h-5 w-5 text-gray-400" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Info Panel */}
                    <div className="lg:col-span-1 space-y-8">
                      <div className="bg-white border border-gray-100 p-10 rounded-lg shadow-2xl shadow-black/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#15803d]" />
                        <span className="bg-emerald-50 text-[#15803d] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-10 inline-block border border-emerald-100">
                          {selectedReport.code}
                        </span>
                        <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 leading-tight">
                          {selectedReport.desc}
                        </h2>
                        
                        {selectedReport.image && (
                          <div 
                            className="aspect-video w-full rounded-lg overflow-hidden mb-8 relative group cursor-zoom-in"
                            onClick={() => setLightbox({ isOpen: true, url: selectedReport.image!, title: selectedReport.desc })}
                          >
                            <img src={selectedReport.image} alt={selectedReport.desc} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" />
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-8 pt-8 border-t border-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-gray-400"><MapPin className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Localizzazione</p>
                                <p className="text-sm font-bold text-[#1e3a5f]">{selectedReport.location}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-gray-400"><Clock className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Data Apertura</p>
                                <p className="text-sm font-bold text-[#1e3a5f]">{selectedReport.date}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#15803d] p-8 rounded-lg shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Activity className="h-32 w-32" /></div>
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-2">Supporto Attivo</h4>
                        <p className="text-xs text-white/70 leading-relaxed font-bold">I nostri operatori monitorano questa pratica h24. Riceverai notifiche in tempo reale.</p>
                      </div>
                    </div>

                    {/* Timeline Panel */}
                    <div className="lg:col-span-2">
                       <div className="bg-white border border-gray-100 p-12 rounded-lg shadow-2xl shadow-black/5 h-full">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-16 flex items-center gap-4">
                             Stato Avanzamento <span className="h-px bg-gray-100 flex-1" />
                          </h3>

                          <div className="space-y-16 relative">
                             {/* Vertical connection line */}
                             <div className="absolute left-[24px] top-4 bottom-4 w-1 bg-gray-100" />
                             
                             {timelineSteps.map((s) => {
                               const isActive = s.id <= getStatusStep(selectedReport.status);
                               const isCurrent = s.id === getStatusStep(selectedReport.status);
                               
                               return (
                                 <div key={s.id} className="relative pl-16">
                                    {/* Node icon */}
                                    <div className={`absolute left-0 top-0 w-12 h-12 rounded-lg border-4 border-white flex items-center justify-center transition-all duration-700 z-10 shadow-lg ${
                                       isActive ? 'bg-[#15803d] text-white' : 'bg-gray-100 text-transparent'
                                    }`}>
                                       {isActive ? <CheckCircle2 className="h-6 w-6" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
                                    </div>

                                    <div className={`transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                       <div className="flex flex-wrap items-center gap-3 mb-2">
                                         <h4 className={`text-xl font-bold transition-colors duration-500 ${
                                            isActive ? 'text-[#1e3a5f]' : 'text-gray-400'
                                         }`}>
                                            {s.label}
                                         </h4>
                                         {isCurrent && (
                                            <span className="text-[9px] bg-emerald-100 text-[#15803d] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-emerald-200 animate-pulse">
                                              Fase Attuale
                                            </span>
                                         )}
                                       </div>
                                       <p className={`text-sm font-medium leading-relaxed transition-colors duration-500 ${
                                          isActive ? 'text-gray-500' : 'text-gray-300'
                                       }`}>
                                          {s.desc}
                                       </p>
                                    </div>
                                 </div>
                               );
                             })}
                          </div>
                          
                          <div className="mt-20 p-8 bg-gray-50 rounded-lg border border-gray-100">
                             <div className="flex items-start gap-4">
                               <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-relaxed">
                                  Informazione: Le tempistiche di intervento sono regolate in base alla gravità della segnalazione. Il Comune di Naro garantisce il pronto intervento per casi di estrema urgenza o pericolo.
                               </p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>

      {showSpidModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 text-left select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col md:flex-row animate-scaleIn">
            {/* Left side: credentials */}
            <div className="p-8 flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#0066cc] text-white px-2 py-0.5 rounded font-black text-[10px] uppercase font-sans">spid</span>
                  <span className="text-[10px] font-black text-slate-400 font-sans tracking-tight uppercase">Identità Digitale</span>
                </div>
                <span className="text-[9px] font-black text-[#0066cc] bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200 uppercase font-sans">
                  {selectedSpidProvider}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-[#101b3a] tracking-tight">Accedi con Credenziali SPID</h3>
                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Verifica i dati forniti dall'Identity Provider {selectedSpidProvider}.</p>
              </div>

              <form onSubmit={handleSpidSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Username o Nome Utente</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-sm text-[#101b3a] focus:bg-white focus:border-blue-600 outline-none transition-all"
                    placeholder="mario.rossi.80"
                    value={spidForm.username}
                    onChange={(e) => setSpidForm({...spidForm, username: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-sm text-[#101b3a] focus:bg-white focus:border-blue-600 outline-none transition-all"
                    value={spidForm.password}
                    onChange={(e) => setSpidForm({...spidForm, password: e.target.value})}
                  />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/80 space-y-3">
                  <span className="text-[9px] font-black text-[#0066cc] uppercase tracking-widest block font-sans">Dati Certificati Trasmessi all'Ente:</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Nome</span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-bold mt-0.5 text-[#101b3a]"
                        value={spidForm.nome}
                        onChange={(e) => setSpidForm({...spidForm, nome: e.target.value})}
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Cognome</span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-bold mt-0.5 text-[#101b3a]"
                        value={spidForm.cognome}
                        onChange={(e) => setSpidForm({...spidForm, cognome: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600">
                    <div>
                      <span className="text-[#15803d] block text-[8px] uppercase tracking-wide flex items-center gap-1 font-bold">
                        Codice Fiscale <span className="text-[7px] bg-red-100 text-red-650 px-1 rounded font-black">LEGGERA</span>
                      </span>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-mono font-bold mt-0.5 uppercase text-[#101b3a]"
                        value={spidForm.codiceFiscale}
                        onChange={(e) => setSpidForm({...spidForm, codiceFiscale: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Email</span>
                      <input
                        type="email"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-bold mt-0.5 text-[#101b3a]"
                        value={spidForm.email}
                        onChange={(e) => setSpidForm({...spidForm, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase tracking-wide font-sans">Telefono Cellulare</span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-bold mt-0.5 text-[#101b3a]"
                        value={spidForm.telefono}
                        onChange={(e) => setSpidForm({...spidForm, telefono: e.target.value})}
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase tracking-wide">Comune di Residenza</span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-blue-500 outline-none font-bold mt-0.5 text-[#101b3a]"
                        value={spidForm.comuneResidenza}
                        onChange={(e) => setSpidForm({...spidForm, comuneResidenza: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSpidModal(false)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-500 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] text-center cursor-pointer font-sans"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#0066cc] hover:bg-[#0052a3] text-white py-3 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-md shadow-blue-500/10 flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    Autorizza e Accedi &rarr;
                  </button>
                </div>
              </form>
            </div>

            {/* Right side: Mock QR code scanner */}
            <div className="bg-slate-50 p-8 border-t md:border-t-0 md:border-l border-slate-200/60 w-full md:w-64 flex flex-col items-center justify-center text-center space-y-6">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-sans">Oppure con App</span>
              
              <div className="relative p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center rounded-xl overflow-hidden relative">
                  {/* QR Core code bars drawing */}
                  <svg className="w-28 h-28 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9h6V3H3v6zm0 12h6v-6H3v6zm12 0h6v-6h-6v6ZM15 3v6h6V3h-6zm-4 4h2V5h-2v2zm0 8h2v-2h-2v2zm0 4h2v-2h-2v2zm4-12h2V5h-2v2zm0 8h2v-2h-2v2zm4 4h2v-2h-2v2z" />
                  </svg>
                  {/* Glowing scanner red line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500 animate-bounce top-2" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700 font-sans">Inquadra QR Code</p>
                <p className="text-[9px] text-slate-450 font-semibold leading-normal font-sans">Accedi istantaneamente scansionando il codice con l'applicazione di {selectedSpidProvider} dal tuo cellulare.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Lightbox 
        isOpen={lightbox.isOpen} 
        imageUrl={lightbox.url} 
        title={lightbox.title}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
