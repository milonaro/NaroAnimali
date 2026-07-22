import express from "express";
import { GoogleGenAI } from "@google/genai";
import { REGOLAMENTI_CONTESTO } from "../../lib/regolamento_randagismo.js";

const router = express.Router();

let genAIInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      genAIInstance = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    }
  }
  return genAIInstance;
}

router.post("/", async (req, res) => {
  const ai = getGenAI();
  if (!ai) {
    return res.status(500).json({ error: "Servizio di intelligenza artificiale non configurato sul server. Verifica GEMINI_API_KEY." });
  }

  try {
    const rawMessages = req.body.messages || [];
    
    // Map messages to Gemini contents structure
    const contents = rawMessages.map((m: any) => {
      // Map "assistant" role to "model" for Gemini API compatibility
      const role = m.role === "assistant" ? "model" : "user";
      return {
        role: role,
        parts: [{ text: m.content }]
      };
    });

    if (contents.length === 0 && req.body.message) {
      contents.push({
        role: "user",
        parts: [{ text: req.body.message }]
      });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "Nessun messaggio fornito nella richiesta." });
    }

    // Prepare system instruction training and context
    const docsSerialized = REGOLAMENTI_CONTESTO.map(doc => `
Documento Categoria/Titolo: ${doc.titolo}
Identificatore Atto: ${doc.identificativo}
Aggiornamento / Data Svolta: ${doc.dataSorgente}
Sommario Punti Chiave:
${doc.puntiChiave.map(p => ` - ${p}`).join("\n")}

Testo Legale Integrale:
${doc.testoIntegrale}
`).join("\n\n---------------------------------------------\n\n");

    const systemInstructionText = `
Sei "Ugo", l'Assistente virtuale della Guida Comunale Intelligente del Comune di Naro (Agrigento). Sei un'intelligenza artificiale addestrata e programmata per supportare i cittadini, i volontari e gli operatori comunali in merito al welfare animale, alla prevenzione del randagismo e ai regolamenti d'ufficio della P.A.

FONDAMENTALE: Rispondi basandoti in modo fedele e accurato sulle seguenti normative, regolamenti comunali e documenti ufficiali caricati dal Comune di Naro. Quando possibile, cita gli articoli specifici di riferimento per avallare le tue risposte (es. "Art. 5 del Regolamento Comunale di Naro" o "Art. 2 della L.R. Siciliana 15/2000").

=== REGOLAMENTI E DOCUMENTI UFFICIALI DI ANAGRAFE E RANDAGISMO ===
${docsSerialized}

=== DIRETTIVE DI COMPORTAMENTO ===
1. Parla sempre in italiano letterario, con un tono educato, cordiale, accogliente e informato (adatto alla PA e comprensibile dal comune cittadino).
2. Sii sintetico ma esaustivo. Quando elenchi adempimenti o passaggi organizzali con elenchi puntati chiari.
3. Se l'utente fa domande del tutto estranee agli animali, al randagismo, ai canili rionali, alle colonie feline, alle sanzioni o ai moduli A/B/C del Comune di Naro, rispondi educatamente che sei l'Assistente virtuale specializzato sulla fauna e il randagismo del portale AnimalHub di Naro, invitando ad attenersi a questi argomenti.
4. Evidenzia l'importanza del Codice Opzione Famiglia (COF) e del fantastico incentivo dell'esenzione sui rifiuti territoriali (TARI) per 3 anni concessa a chi adotta.
`;

    // Invoke Gemini 2.1 Flash as standard for Q&A tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.1-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstructionText,
        temperature: 0.3,
      }
    });

    const replyText = response.text || "Spiacente, non sono riuscito a elaborare una risposta soddisfacente.";
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Errore chiamata Gemini:", err.message);
    res.status(500).json({ error: "Errore durante l'elaborazione della risposta con l'Intelligenza Artificiale.", details: err.message });
  }
});

export default router;
