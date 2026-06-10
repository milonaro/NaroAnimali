import ComplianceLayout from '@/src/components/layout/ComplianceLayout';

export function PrivacyPolicy() {
  return (
    <ComplianceLayout title="Informativa Privacy (Privacy Policy)">
      <div className="space-y-6">
        <p className="lead text-lg font-medium text-slate-700">
          Ai sensi del Regolamento Generale sulla Protezione dei Dati (GDPR - Regolamento UE 2016/679) e del D.Lgs. 196/2003 ("Codice Privacy"), così come modificato dal D.Lgs. 101/2018, questa informativa descrive le modalità di trattamento dei dati personali degli utenti che consultano e utilizzano i servizi telematici della piattaforma <strong>AnimalHub PA</strong>.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">1. Titolare del Trattamento (Titolare)</h2>
          <p>
            Il Titolare del trattamento è il <strong>Comune di Naro</strong> (o l'Ente Comunale associato e selezionato dall'utente all'atto della navigazione), con sede legale presso il rispettivo Palazzo Municipale dell'ente territoriale di riferimento.
          </p>
          <p>
            I contatti del Titolare e del Responsabile per la Protezione dei Dati (RPD/DPO), ove nominato, sono consultabili sul portale istituzionale del Comune di appartenenza o contattando i rispettivi uffici per le Relazioni con il Pubblico (URP).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">2. Tipologia di Dati Personali Trattati</h2>
          <p>La piattaforma tratta le seguenti tipologie di dati personali conferite dagli utenti cittadini e operatori:</p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>
              <strong>Dati di Autenticazione (Cittadini):</strong> Indirizzo email ed eventuali log di accesso temporanei utilizzati per l'invio del codice OTP (One-Time Password) necessario all'autenticazione sicura dell'utente civico.
            </li>
            <li>
              <strong>Dati di Contatto e Segnalazione:</strong> Nome, cognome, indirizzo email ed eventuale recapito telefonico inseriti facoltativamente o obbligatoriamente all'atto dell'invio di una segnalazione di un animale randagio o ferito.
            </li>
            <li>
              <strong>Dati di Localizzazione e Georeferenziazione:</strong> Coordinate geografiche GPS o dettagli dell'indirizzo acquisiti al momento dell'invio della segnalazione, necessari per consentire l'intervento degli operatori e del servizio veterinario ASP.
            </li>
            <li>
              <strong>Contenuti Multimediali:</strong> Fotografie e immagini caricate a corredo delle segnalazioni (in cui si invita l'utente a non includere volti di persone, targhe di veicoli o altri elementi identificativi protetti).
            </li>
            <li>
              <strong>Dati di Profilo Operatori:</strong> Nome utente, indirizzo email, qualifica e ruolo lavorativo (Amministratore, Operatore Comunale, Veterinario, Volontario) ed Ente Comunale di appartenenza per l'instradamento delle pratiche.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">3. Finalità e Base Giuridica del Trattamento</h2>
          <p>I dati personali raccolti attraverso questo portale vengono trattati per le seguenti finalità istituzionali:</p>
          <ol className="list-decimal ml-6 text-gray-700 space-y-2">
            <li>
              <strong>Gestione delle segnalazioni di randagismo e benessere animale:</strong> Raccolta dei dati per pianificare i recuperi, attivare il servizio veterinario di soccorso e monitorare il territorio. 
              <br />
              <span className="text-xs text-slate-500 font-bold">Base giuridica:</span> Esecuzione di un compito di interesse pubblico o connesso all'esercizio di pubblici poteri di cui è investito il Titolare del trattamento (art. 6, par. 1, lett. e del GDPR, in ottemperanza alla Legge Quadro n. 281/1991 e alle correlate leggi regionali).
            </li>
            <li>
              <strong>Accesso al proprio Fascicolo Elettronico ("La Mia Area"):</strong> Gestione della procedura di autenticazione e consultazione dello storico delle proprie segnalazioni o pratiche di adozione approvate.
              <br />
              <span className="text-xs text-slate-500 font-bold">Base giuridica:</span> Esecuzione di un servizio telematico pubblico richiesto direttamente dall'interessato (art. 6, par. 1, lett. b del GDPR).
            </li>
            <li>
              <strong>Pratiche di affido, adozione e tracciamento spese:</strong> Monitoraggio legale del percorso adottivo degli animali dai rifugi sanitari o canili convenzionati alle famiglie residenti nell'ente.
              <br />
              <span className="text-xs text-slate-500 font-bold">Base giuridica:</span> Esecuzione di misure precontrattuali o contrattuali e conformazione agli obblighi normativi vigenti (art. 6, par. 1, lett. b ed e del GDPR).
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">4. Destinatari e Ambito di Comunicazione dei Dati</h2>
          <p>
            I dati personali dell'interessato potranno essere comunicati a soggetti esterni specificamente nominati e autorizzati, che agiscono in qualità di Responsabili del Trattamento o di autonomi Titolari:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Servizi Veterinari dell'Azienda Sanitaria Provinciale (ASP) competente per territorio;</li>
            <li>Gestori privati, associazioni di volontariato o cliniche veterinarie affidatarie di canili rifugio e sanità pubblica;</li>
            <li>Personale dipendente dell'Amministrazione Comunale incaricato dei servizi ambientali e di polizia municipale;</li>
            <li>Fornitori tecnologici della piattaforma gestionale (limitatamente alla manutenzione dell'infrastruttura Cloud e dei servizi di posta OTP).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">5. Trasferimento dei Dati e Conservazione</h2>
          <p>
            Tutti i dati personali trattati da questa piattaforma risiedono su server localizzati all'interno dell'Unione Europea. Non si effettuano trasferimenti verso Paesi terzi o organizzazioni internazionali al di fuori dello Spazio Economico Europeo (SEE).
          </p>
          <p>
            In ottemperanza ai principi di proporzionalità e minimizzazione (art. 5, par. 1, lett. c del GDPR), i dati correlati alle segnalazioni e all'anagrafe interna degli animali sono conservati per il tempo strettamente necessario a completare i flussi operativi o secondo i termini archivistici di conservazione dei documenti previsti per le Pubbliche Amministrazioni italiane (pari di norma a 10 anni).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">6. Diritti dell'Interessato (Artt. 15-22 GDPR)</h2>
          <p>
            In qualità di soggetto interessato, l'utente può esercitare in qualsiasi momento i seguenti diritti garantiti dal Regolamento UE:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li><strong>Diritto di Accesso:</strong> Richiedere la conferma del trattamento dei propri dati e riceverne copia (art. 15);</li>
            <li><strong>Diritto di Rettifica:</strong> Richiedere l'aggiornamento o la correzione di dati inesatti o incompleti (art. 16);</li>
            <li><strong>Diritto di Cancellazione (Oblio):</strong> Richiedere la rimozione dei propri dati qualora non sussistano più obblighi legali di conservazione da parte della PA (art. 17);</li>
            <li><strong>Diritto di Limitazione:</strong> Richiedere che il trattamento sia ristretto solo ad alcune finalità in pendenza di accertamenti (art. 18);</li>
            <li><strong>Diritto all'Opposizione:</strong> Opporsi al trattamento per motivi legittimi connessi alla propria situazione particolare (art. 21).</li>
          </ul>
          <p className="mt-2 text-slate-705">
            Le relative richieste possono essere inoltrate per iscritto all'Amministrazione Comunale di riferimento via PEC o raccomandata A/R. L'interessato ha inoltre il diritto di proporre formale reclamo all'Autorità Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline hover:text-emerald-800">www.garanteprivacy.it</a>) qualora ritenga che il trattamento avvenga in violazione del GDPR.
          </p>
        </section>
      </div>
    </ComplianceLayout>
  );
}

export function Accessibilita() {
  return (
    <ComplianceLayout title="Dichiarazione di Accessibilità">
      <div className="space-y-6">
        <p className="lead text-lg font-medium text-slate-700">
          Il <strong>Comune di Naro</strong> e le amministrazioni associate si impegnano a rendere il proprio sito web accessible, conformemente alla <strong>Legge 9 gennaio 2004, n. 4</strong> ("Disposizioni per favorire l'accesso dei soggetti disabili agli strumenti informatici") ed alle relative linee guida dell'<strong>AgID</strong> (Agenzia per l'Italia Digitale).
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Stato di Conformità</h2>
          <p>
            Questo sito web è <strong>parzialmente conforme</strong> ai requisiti previsti dalle linee guida sull'accessibilità degli strumenti informatici (WCAG 2.1 con livello di conformità <strong>AA</strong>), a causa dei casi di incongruenza o delle limitazioni elencate di seguito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Contenuti non Accessibili o in Corso di Ottimizzazione</h2>
          <p>
            Alcuni moduli, componenti grafici o dati informativi della piattaforma potrebbero temporaneamente risultare non pienamente conformi agli standard di accessibilità:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>
              <strong>Mappe Interattive (Georeferenziazione):</strong> La rappresentazione geografica e l'interazione spaziale della mappa (es. segnalazioni sul territorio) possono presentare ostacoli all'uso di screen reader e mancare di una perfetta resa semantica testuale. In alternativa, il cittadino può visionare lo stesso elenco in formato tabellare o richiedere assistenza via email.
            </li>
            <li>
              <strong>File Allegati Storici:</strong> Eventuali moduli scaricabili o documenti scansionati risalenti ad anni precedenti al rilascio potrebbero non disporre di tag di lettura strutturati per i lettori di schermo.
            </li>
            <li>
              <strong>Elementi Dinamici di Terze Parti:</strong> Alcuni grafici o caroselli dinamici forniti da librerie open-source o strumenti esterni potrebbero non supportare appieno tutte le scorciatoie di tastiera o possedere rapporti di contrasto ottimizzati sotto ogni risoluzione.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Redazione della Dichiarazione di Accessibilità</h2>
          <p>
            La presente dichiarazione è stata redatta sulla base di un'<strong>autovalutazione</strong> effettuata direttamente dal soggetto erogatore in fase di sviluppo, seguendo le checklist WCAG 2.1 di livello A e AA e le metriche di usabilità dei portali della Pubblica Amministrazione.
          </p>
          <p className="text-xs text-slate-500 italic">
            Ultimo aggiornamento della dichiarazione: 10 giugno 2026.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Meccanismo di Feedback</h2>
          <p>
            Al fine di consentire il continuo miglioramento dell'accessibilità dei servizi, chiunque riscontri difficoltà nell'utilizzo della piattaforma o noti violazioni ai criteri di conformità può inviare una segnalazione dettagliata al nostro ufficio tecnico.
          </p>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-2">
            <p className="font-extrabold text-slate-800 uppercase tracking-wider text-xs mb-3">Canali per la segnalazione di feedback:</p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><strong>Email:</strong> <a href="mailto:supporto.accessibilita@comune.naro.ag.it" className="text-emerald-700 underline font-semibold">supporto.accessibilita@comune.naro.ag.it</a></li>
              <li><strong>PEC:</strong> <a href="mailto:protocollo.naro@pec.it" className="text-emerald-700 underline font-semibold">protocollo.naro@pec.it</a></li>
              <li><strong>Telefono URP:</strong> +39 0922 956111</li>
            </ul>
          </div>
          <p className="mt-3">
            In caso di risposta insoddisfacente o mancata presa in carico da parte dell'ufficio preposto, l'interessato può ricorrere al <strong>difensore civico per l'accessibilità</strong> istituito presso l'AgID, attivando la procedura di garanzia prevista per legge.
          </p>
        </section>
      </div>
    </ComplianceLayout>
  );
}

export function CookiePolicy() {
  return (
    <ComplianceLayout title="Informativa sui Cookie (Cookie Policy)">
      <div className="space-y-6">
        <p className="lead text-lg font-medium text-slate-700">
          La presente informativa descrive l'utilizzo dei cookie e di altre tecnologie di archiviazione locale (localStorage e sessionStorage) su questo portale civico, in ottemperanza alle direttive del Garante per la Privacy e in coerenza con la complessiva politica di trasparenza dell'ente.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">1. Cosa sono i Cookie?</h2>
          <p>
            I cookie sono file di testo di piccoli dimensioni che i siti visitati dall'utente inviano e registrano sul suo computer o dispositivo mobile, per essere poi ritrasmessi agli stessi siti alla successiva visita. Ad essi sono assimilate tecnologie analoghe di tracciamento o archiviazione client-side disponibili nei browser moderni (come l'oggetto <em>Window.localStorage</em>).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">2. Cookie e Storage Utilizzati in questa Piattaforma</h2>
          <p>
            Questa applicazione fa uso esclusivamente di <strong>cookie e storage tecnici strettamente necessari</strong> al funzionamento sicuro, efficiente e personalizzato del software. Non viene utilizzato alcun cookie di profilazione commerciale, di tracciamento pubblicitario o di terze parti a scopo di marketing.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-3">Nome / Proprietà</th>
                  <th className="p-3">Tipologia / Natura</th>
                  <th className="p-3">Scopo / Finalità</th>
                  <th className="p-3">Durata / Scadenza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                <tr>
                  <td className="p-3 font-mono font-bold text-[#1e3a5f]">citizen_token</td>
                  <td className="p-3">Cookie / Tecnico (HttpOnly)</td>
                  <td className="p-3">Mantiene la sessione protetta per l'accesso dei cittadini all'area riservata (Fascicolo Elettronico).</td>
                  <td className="p-3">Di sessione (scade alla chiusura)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#1e3a5f]">admin_token</td>
                  <td className="p-3">Cookie / Tecnico (HttpOnly)</td>
                  <td className="p-3">Gestisce l'autenticazione sicura del personale comunale d'ufficio e dei veterinari.</td>
                  <td className="p-3">Di sessione / 24 ore</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#1e3a5f]">cookie-consent</td>
                  <td className="p-3">localStorage / Tecnico</td>
                  <td className="p-3">Memorizza la presa visione ed il consenso prestato sul Banner dei Cookie al primo avvio.</td>
                  <td className="p-3">Fino a cancellazione manuale</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#1e3a5f]">active_comune</td>
                  <td className="p-3">localStorage / Tecnico</td>
                  <td className="p-3">Ricorda l'ultimo comune selezionato dall'utente per personalizzare dinamicamente i contenuti e le segnalazioni territoriali.</td>
                  <td className="p-3">Fino a cancellazione manuale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">3. Servizi e Strumenti di Analisi delle Terze Parti</h2>
          <p>
            La piattaforma non integra banner pubblicitari di terze parti né pixel di social network (es: Meta Pixel). Eventuali integrazioni cartografiche ed estetiche (ad esempio, le librerie di Leaflet o OpenStreetMap) sono ottimizzate per salvaguardare l'indirizzo IP dell'interessato e non memorizzano identificativi persistenti sul dispositivo, a tutela della riservatezza dei cittadini.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">4. Come Gestire o Disabilitare i Cookie dal Browser</h2>
          <p>
            È possibile bloccare, limitare o cancellare del tutto i cookie installati configurando opportunamente le impostazioni del proprio browser web di navigazione. Si ricorda, tuttavia, che la completa disattivazione dei cookie di sessione o tecnici indicati al paragrafo 2 potrebbe impedire l'autenticazione ed inficiare l'utilizzo dei servizi riservati presenti nel sito.
          </p>
          <p>La procedura dettagliata per ciascuno dei principali browser è reperibile ai seguenti canali ufficiali:</p>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline hover:text-emerald-800">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline hover:text-emerald-800">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline hover:text-emerald-800">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-e-gestire-i-cookie-168dab11-0753-24ad-728a-11133d85c7d9" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline hover:text-emerald-800">Microsoft Edge</a></li>
          </ul>
        </section>
      </div>
    </ComplianceLayout>
  );
}
