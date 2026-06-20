import React from 'react';

export default function ComplianceLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 flex flex-col pt-28 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6 flex-1">
        
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Informativa Legale</span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#101b3a] tracking-tight mt-0.5">{title}</h1>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider text-left">
                Garanzia di Trasparenza, Sicurezza e Rispetto dei Diritti del Cittadino conformemente al GDPR.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-slate-700 leading-relaxed font-sans">
          <div className="max-w-none space-y-6">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}

