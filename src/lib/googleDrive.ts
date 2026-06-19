import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Attempt to get the token, fallback to localStorage cache for better UX (non-persistent between sessions but helpful across page refreshes)
const TOKEN_CACHE_KEY = 'naro_gdrive_token';

export const initDriveAuth = () => {
  const savedToken = sessionStorage.getItem(TOKEN_CACHE_KEY);
  if (savedToken) {
    cachedAccessToken = savedToken;
  }
};

export const logoutDrive = async () => {
  cachedAccessToken = null;
  sessionStorage.removeItem(TOKEN_CACHE_KEY);
  await auth.signOut();
};

export const googleSignInDrive = async (): Promise<string> => {
  if (cachedAccessToken) return cachedAccessToken;
  
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    SCOPES.forEach(scope => provider.addScope(scope));
    
    // Prompt to select account
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere il token di accesso GDrive.');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem(TOKEN_CACHE_KEY, cachedAccessToken);
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Spid / Google Auth Drive Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    const saved = sessionStorage.getItem(TOKEN_CACHE_KEY);
    if (saved) cachedAccessToken = saved;
  }
  return cachedAccessToken;
};

// Google Drive API Helpers
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export const listDriveFiles = async (queryParam?: string): Promise<DriveFile[]> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Non autenticato su Google Drive.');

  // Default to listing PDF files or images relevant to Naro AnimalHub
  let query = "trashed = false";
  if (queryParam) {
    query += ` and ${queryParam}`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink)&q=${encodeURIComponent(query)}&orderBy=createdTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Errore durante il recupero dei file da Google Drive.');
  }

  const data = await res.json();
  return data.files || [];
};

export const uploadToDrive = async (
  filename: string,
  mimeType: string,
  fileData: Blob
): Promise<DriveFile> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Non autenticato su Google Drive.');

  // Check if "AnimalHub Naro" folder exists, if not create it to organize nicely
  let folderId = await getOrCreateAppFolder(token);

  const metadata: any = {
    name: filename,
    mimeType: mimeType
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = 'naro_animalhub_gdrive_upload_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  // Read blob to ArrayBuffer
  const arrayBuffer = await fileData.arrayBuffer();
  
  const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaPartHeader = `Content-Type: ${mimeType}\r\n\r\n`;

  const blob = new Blob([
    delimiter,
    metadataPart,
    delimiter,
    mediaPartHeader,
    new Uint8Array(arrayBuffer),
    close_delim
  ], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: blob
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Errore durante il caricamento del file su Google Drive.");
  }

  return await res.json();
};

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Non autenticato su Google Drive.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Errore dell'API di Google Drive durante l'eliminazione.");
  }
};

// Lazy creation of parent folder "AnimalHub Naro"
async function getOrCreateAppFolder(token: string): Promise<string | null> {
  const query = "mimeType = 'application/vnd.google-apps.folder' and name = 'AnimalHub Naro' and trashed = false";
  try {
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Creating folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'AnimalHub Naro',
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (createRes.ok) {
      const data = await createRes.json();
      return data.id;
    }
  } catch (e) {
    console.error('Errore durante la gestione della cartella d\'archivio:', e);
  }
  return null;
}
