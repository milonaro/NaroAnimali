import { useState, useEffect } from 'react';
import ComplianceLayout from '@/src/components/layout/ComplianceLayout';
import { DEFAULT_PRIVACY_TEXT, DEFAULT_COOKIE_TEXT } from '@/src/lib/defaultTexts';
import { parseMarkdownToReact } from '@/src/utils/markdownRenderer';

export function PrivacyPolicy() {
  const [customText, setCustomText] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.privacy_text) {
            setCustomText(config.privacy_text);
          }
        }
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  const textToRender = customText || DEFAULT_PRIVACY_TEXT;

  return (
    <ComplianceLayout title="Informativa Privacy (Privacy Policy)">
      <div className="space-y-6">
        {parseMarkdownToReact(textToRender)}
      </div>
    </ComplianceLayout>
  );
}

export function CookiePolicy() {
  const [customText, setCustomText] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/config");
        if (res.ok) {
          const config = await res.json();
          if (config.cookie_text) {
            setCustomText(config.cookie_text);
          }
        }
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  const textToRender = customText || DEFAULT_COOKIE_TEXT;

  return (
    <ComplianceLayout title="Informativa sui Cookie (Cookie Policy)">
      <div className="space-y-6">
        {parseMarkdownToReact(textToRender)}
      </div>
    </ComplianceLayout>
  );
}

export function Accessibilita() {
  return (
    <ComplianceLayout title="Dichiarazione di Accessibilità">
      <div className="space-y-6">
        <p className="text-sm sm:text-base leading-relaxed text-slate-650 font-medium">
          <strong>L'Ente</strong> e le amministrazioni associate si impegnano a rendere il proprio sito web accessibile, conformemente alla <strong>Legge 9 gennaio 2004, n. 4</strong> ("Disposizioni per favorire l'accesso dei soggetti disabili agli strumenti informatici") ed alle relative linee guida dell'<strong>AgID</strong> (Agenzia per l'Italia Digitale).
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#1e3a5f] border-b border-slate-100 pb-2 mt-6 mb-3">Stato di Conformità</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Questo sito web è <strong>parzialmente conforme</strong> ai requisiti previsti dalle linee guida sull'accessibilità degli strumenti informatici (WCAG 2.1 con livello di conformità <strong>AA</strong>), a causa dei casi di incongruenza o delle limitazioni elencate di di seguito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#1e3a5f] border-b border-slate-100 pb-2 mt-6 mb-3">Contenuti non Accessibili o in Corso di Ottimizzazione</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Alcuni moduli, componenti grafici o dati informativi della piattaforma potrebbero temporaneamente risultare non pienamente conformi agli standard di accessibilità:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 my-4 text-slate-600">
            <li className="text-sm font-medium leading-relaxed">
              <strong>Mappe Interattive (Georeferenziazione):</strong> La rappresentazione geografica e l'interazione spaziale della mappa (es. segnalazioni sul territorio) possono presentare ostacoli all'uso di screen reader e mancare di una perfetta resa semantica testuale. In alternativa, il cittadino può visionare lo stesso elenco in formato tabellare o richiedere assistenza via email.
            </li>
            <li className="text-sm font-medium leading-relaxed">
              <strong>File Allegati Storici:</strong> Eventuali moduli scaricabili o documenti scansionati risalenti ad anni precedenti al rilascio potrebbero non disporre di tag di lettura strutturati per i lettori di schermo.
            </li>
            <li className="text-sm font-medium leading-relaxed">
              <strong>Elementi Dinamici di Terze Parti:</strong> Alcuni grafici o caroselli dinamici forniti da librerie open-source o strumenti esterni potrebbero non supportare appieno tutte le scorciatoie di tastiera o possedere rapporti di contrasto ottimizzati sotto ogni risoluzione.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#1e3a5f] border-b border-slate-100 pb-2 mt-6 mb-3">Redazione della Dichiarazione di Accessibilità</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            La presente dichiarazione è stata redatta sulla base di un'<strong>autovalutazione</strong> effettuata direttamente dal soggetto erogatore in fase di sviluppo, seguendo le checklist WCAG 2.1 di livello A e AA e le metriche di usabilità dei portali della Pubblica Amministrazione.
          </p>
          <p className="text-xs text-slate-400 italic mt-2">
            Ultimo aggiornamento della dichiarazione: 10 giugno 2026.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#1e3a5f] border-b border-slate-100 pb-2 mt-6 mb-3">Meccanismo di Feedback</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Al fine di consentire il continuo miglioramento dell'accessibilità dei servizi, chiunque riscontri difficoltà nell'utilizzo della piattaforma o noti violazioni ai criteri di conformità può inviare una segnalazione dettagliata al nostro ufficio tecnico.
          </p>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-4">
            <p className="font-extrabold text-slate-800 uppercase tracking-wider text-xs mb-3">Canali per la segnalazione di feedback:</p>
            <ul className="space-y-2 text-sm text-slate-755">
              <li><strong>Email:</strong> <a href="mailto:supporto.accessibilita@comune.naro.ag.it" className="text-emerald-700 underline font-semibold">supporto.accessibilita@comune.naro.ag.it</a></li>
              <li><strong>PEC:</strong> <a href="mailto:protocollo.naro@pec.it" className="text-emerald-700 underline font-semibold">protocollo.naro@pec.it</a></li>
              <li><strong>Telefono URP:</strong> +39 0922 956111</li>
            </ul>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            In caso di risposta insoddisfacente o mancata presa in carico da parte dell'ufficio preposto, l'interessato può ricorrere al <strong>difensore civico per l'accessibilità</strong> istituito presso l'AgID, attivando la procedura di garanzia prevista per legge.
          </p>
        </section>
      </div>
    </ComplianceLayout>
  );
}
