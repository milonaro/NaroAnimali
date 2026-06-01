import React from 'react';

export default function ComplianceLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      <div className="prose prose-emerald max-w-none text-gray-600 space-y-4">
        {children}
      </div>
    </div>
  );
}
