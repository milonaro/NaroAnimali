import { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Search, Clock, CheckCircle2, ChevronRight, ArrowLeft, Loader2, MapPin, Activity, HelpCircle, Info, Download, BarChart3, Maximize2 } from 'lucide-react';
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

export default function MiaArea() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: dashboard
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: ''
  });

  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/otp/me");
      if (res.ok) {
        const data = await res.json();
        setEmail(data.user.email);
        await loadReports(data.user.email);
      }
    } catch (e) {
      // Not authenticated
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
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'invio dell'OTP");
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
      
      await loadReports(email);
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
    setSelectedReport(null);
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
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Accesso Sicuro OTP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="max-w-md mx-auto w-full pt-12"
              >
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-8">
                  <div className="text-center">
                    <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Mail className="text-[#15803d] h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black text-[#101b3a] tracking-tight">Verifica la tua Identità</h2>
                    <p className="text-slate-500 text-xs font-bold mt-1.5 uppercase tracking-wide">Inserisci la tua email per accedere al tuo dossier.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Indirizzo Email</label>
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
                    className="w-full bg-[#15803d] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md shadow-[#15803d]/20 hover:bg-[#166534] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Invia Codice Accesso &rarr;</>}
                  </button>
                </div>
                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-8 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Servizio di Sicurezza Certificato SLL
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
                          <h1 className="text-xl sm:text-2xl font-black text-[#101b3a] tracking-tight">Le tue segnalazioni di soccorso</h1>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs text-slate-500 font-semibold">Utenza attiva: <span className="text-[#101b3a] font-extrabold">{email}</span></p>
                          </div>
                        </div>
                        <button onClick={handleLogout} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-red-600 transition-all py-2.5 px-5 bg-slate-50 border border-slate-200 hover:border-red-200 rounded-xl cursor-pointer">Esci Sessione</button>
                      </div>

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

      <Lightbox 
        isOpen={lightbox.isOpen} 
        imageUrl={lightbox.url} 
        title={lightbox.title}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
}
