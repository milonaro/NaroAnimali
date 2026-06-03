import React, { useEffect, useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, Server, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function DebugDb() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/debug/db');
        if (!response.ok) {
          throw new Error('Errore durante il recupero dei dati');
        }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="pt-32 pb-24 text-center min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#15803d] border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-24 px-4 min-h-screen bg-gray-50 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Errore di Debug</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50 text-sans">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-[#101b3a] tracking-tight mb-4 flex items-center justify-center gap-3">
            <Database className="h-8 w-8 text-[#15803d]" />
            Dashboard Debug Database
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Pannello di controllo per verificare la connessione ai db relazionali (Aruba MySQL / SQLite) e Firebase Firestore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MYSQL PANEL */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <Server className="h-6 w-6 text-[#1e40af]" />
              <h2 className="text-xl font-bold text-gray-900">Database Relazionale</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold uppercase text-gray-400 mb-1 block">Stato Connessione</span>
                <div className="flex items-center gap-2">
                  {data?.mysql?.status?.includes('Connesso') || data?.mysql?.status?.includes('Fallback') ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900">{data?.mysql?.status}</span>
                </div>
              </div>

              {data?.mysql?.error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  {data?.mysql?.error}
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold uppercase text-gray-400 mb-2 block">Configurazione .env</span>
                <ul className="space-y-2 text-sm text-gray-600 font-mono">
                  <li><span className="font-semibold">DB_HOST:</span> {data?.mysql?.config?.host}</li>
                  <li><span className="font-semibold">DB_NAME:</span> {data?.mysql?.config?.database}</li>
                  <li><span className="font-semibold">DB_USER:</span> {data?.mysql?.config?.user}</li>
                </ul>
              </div>

              <div className="pt-4">
                 <span className="text-xs font-bold uppercase text-gray-400 mb-2 block">Anteprima Dati (Top 5)</span>
                 <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                   <pre className="text-[10px] text-emerald-400 font-mono">
                     {JSON.stringify(data?.mysql?.sampleData, null, 2) || "Nessun dato o query fallita"}
                   </pre>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* FIRESTORE PANEL */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 overflow-hidden">
             <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-[#f59e0b]" />
              <h2 className="text-xl font-bold text-gray-900">Firestore (Realtime)</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs font-bold uppercase text-gray-400 mb-1 block">Stato Connessione</span>
                <div className="flex items-center gap-2">
                  {data?.firestore?.status === 'Connesso' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900">{data?.firestore?.status}</span>
                </div>
              </div>

              {data?.firestore?.error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  {data?.firestore?.error}
                </div>
              )}

              <div className="pt-4">
                 <span className="text-xs font-bold uppercase text-gray-400 mb-2 block">Anteprima Dati (Top 5)</span>
                 <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                   <pre className="text-[10px] text-[#f59e0b] font-mono">
                     {JSON.stringify(data?.firestore?.sampleData, null, 2) || "Nessun dato o query fallita"}
                   </pre>
                 </div>
              </div>
            </div>
          </motion.div>
        
        </div>
      </div>
    </div>
  );
}
