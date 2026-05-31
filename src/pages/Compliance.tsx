import ComplianceLayout from '@/src/components/layout/ComplianceLayout';

export function PrivacyPolicy() {
  return (
    <ComplianceLayout title="Privacy Policy">
      <p>I dati personali raccolti tramite questa piattaforma sono trattati dal Comune di Naro nel rispetto del Regolamento UE 2016/679 (GDPR).</p>
      <h2 className="text-xl font-bold mt-4 text-gray-900">Finalità del trattamento</h2>
      <p>I dati vengono raccolti esclusivamente per la gestione delle segnalazioni di randagismo e per fornire aggiornamenti sullo stato delle pratiche.</p>
    </ComplianceLayout>
  );
}

export function Accessibilita() {
  return (
    <ComplianceLayout title="Dichiarazione di Accessibilità">
      <p>Il Comune di Naro si impegna a rendere il proprio sito web accessibile, conformemente alla legge 9 gennaio 2004, n. 4.</p>
      <p>Questa piattaforma è stata progettata per essere fruibile da tutti i cittadini, indipendentemente da eventuali disabilità.</p>
    </ComplianceLayout>
  );
}

export function CookiePolicy() {
  return (
    <ComplianceLayout title="Cookie Policy">
      <p>Questa piattaforma utilizza solo cookie tecnici necessari al corretto funzionamento del servizio (es: gestione della sessione OTP).</p>
      <p>Non vengono utilizzati cookie di profilazione o di terze parti per finalità di marketing.</p>
    </ComplianceLayout>
  );
}
