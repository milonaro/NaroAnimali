export enum AnimalSpecie {
  CANE = "CANE",
  GATTO = "GATTO",
  ALTRO = "ALTRO"
}

export enum SegnalazioneStato {
  NUOVA = "NUOVA",
  IN_CARICO = "IN_CARICO",
  INTERVENTO = "INTERVENTO",
  CHIUSA = "CHIUSA"
}

export interface Segnalazione {
  id?: string;
  codiceTracking?: string;
  specie: AnimalSpecie;
  taglia?: string;
  colore: string;
  condizioni: string;
  descrizione: string;
  fotoUrl?: string;
  latitudine: number;
  longitudine: number;
  indirizzo: string;
  zona: string;
  stato: SegnalazioneStato;
  urgenza: string;
  nomeSegnalante: string;
  cognomeSegnalante: string;
  telefonoSegnalante: string;
  emailSegnalante: string;
  consensoPrivacy: boolean;
  consensoNotifiche: boolean;
  dichiarazioneVeridicita: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface ComuneConfig {
  nomeComune: string;
  provincia: string;
  center: { lat: number; lng: number };
  radiusKm: number;
}
