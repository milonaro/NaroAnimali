import ComplianceLayout from '@/src/components/layout/ComplianceLayout';

export function PrivacyPolicy() {
  return (
    <ComplianceLayout title="Privacy Policy">
      <p>I dati personali raccolti tramite questa piattaforma sono trattati dal Comune competente (Titolare del Trattamento) nel pieno rispetto del Regolamento UE 2016/679 (GDPR).</p>
      
      <h2 className="text-xl font-bold mt-6 text-gray-900">Finalità e Base Giuridica</h2>
      <p>I dati vengono raccolti esclusivamente per:</p>
      <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
        <li>Gestione delle segnalazioni di randagismo e interventi sul territorio (Esecuzione di un compito di interesse pubblico).</li>
        <li>Registrazione civica (OTP) per l'accesso al proprio fascicolo elettronico.</li>
        <li>Pratiche di adozione e comunicazioni inerenti (Esecuzione di misure precontrattuali/contrattuali).</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 text-gray-900">Conservazione dei Dati</h2>
      <p>I dati forniti verranno conservati per il tempo strettamente necessario alla gestione della pratica e in ottemperanza agli obblighi di legge previsti per le Pubbliche Amministrazioni, dopodiché saranno anonimizzati o cancellati in modo sicuro.</p>

      <h2 className="text-xl font-bold mt-6 text-gray-900">Diritti dell'Interessato (Artt. 15-22 GDPR)</h2>
      <p>In qualunque momento hai il diritto di richiedere al Titolare del Trattamento l'accesso, la rettifica, la cancellazione dei tuoi dati personali, o di opporti al loro trattamento. Le richieste vanno inoltrate direttamente all'URP del Comune di riferimento.</p>
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
      <p>Questa piattaforma utilizza cookie tecnici e storage locale (localStorage/sessionStorage) necessari al corretto funzionamento del servizio. Non vengono utilizzati cookie di profilazione o di terze parti per finalità di marketing senza il tuo esplicito consenso.</p>
      
      <h2 className="text-xl font-bold mt-6 text-gray-900">Cookie e Storage Utilizzati</h2>
      <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
        <li><strong>citizen_token / admin_token</strong>: Cookie tecnicamente necessari (HttpOnly) per mantenere l'autenticazione sicura dell'utente loggato (Cittadino o Operatore).</li>
        <li><strong>cookie-consent</strong>: Valore salvato in localStorage per ricordare le preferenze espresse nel banner dei cookie.</li>
        <li><strong>active_comune</strong>: Valore salvato in localStorage per mantenere il contesto del comune selezionato durante la navigazione.</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 text-gray-900">Gestione dei Cookie</h2>
      <p>Puoi gestire le preferenze sui cookie direttamente dal nostro banner al primo accesso. Inoltre, la maggior parte dei browser ti permette di rifiutare o accettare i cookie, nonché di cancellarli. Rifiutare i cookie tecnici potrebbe compromettere alcune funzionalità essenziali (come il login).</p>
    </ComplianceLayout>
  );
}
