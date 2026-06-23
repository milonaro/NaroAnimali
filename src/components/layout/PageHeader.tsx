import React from 'react';

interface PageHeaderProps {
  sopraTitolo: string;
  titolo: string;
  sottotitolo: string | React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ sopraTitolo, titolo, sottotitolo, icon, children }: PageHeaderProps) {
  return (
    <div className="w-full bg-linear-to-r from-[#101b3a] to-[#1e3a5f] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden mb-6 border border-slate-700/30">
      {/* Abstract decorative background ring for a high-end feel */}
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute right-24 bottom-6 w-28 h-28 rounded-full bg-[#15803d]/15 blur-xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 text-left flex-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] px-3.5 py-1 rounded-full border border-emerald-500/30">
            {icon ? icon : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {sopraTitolo}
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-white mt-1">
            {titolo}
          </h1>
          <div className="text-xs sm:text-sm text-slate-300 font-bold tracking-wide uppercase">
            {sottotitolo}
          </div>
        </div>
        
        {children && (
          <div className="relative z-10 self-start md:self-auto shrink-0 w-full md:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
