import { useEffect, useState } from 'react';

export interface StoredCandidateSession {
  referenceCode: string;
  candidateName: string;
  email: string;
  department: string;
  studyLevel: string;
  createdAt: string;
  syncedToGoogleSheets?: boolean;
}

const STORAGE_KEY = 'ucaep_candidate_session';
const SESSION_EVENT = 'ucaep-candidate-session-change';

export function getCandidateSession(): StoredCandidateSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCandidateSession>;
    if (!parsed || typeof parsed.referenceCode !== 'string' || !parsed.referenceCode.trim()) {
      return null;
    }
    return {
      referenceCode: parsed.referenceCode.trim().toUpperCase(),
      candidateName: String(parsed.candidateName || ''),
      email: String(parsed.email || '').trim(),
      department: String(parsed.department || ''),
      studyLevel: String(parsed.studyLevel || ''),
      createdAt: String(parsed.createdAt || new Date().toISOString()),
      syncedToGoogleSheets: Boolean(parsed.syncedToGoogleSheets),
    };
  } catch {
    return null;
  }
}

export function saveCandidateSession(session: StoredCandidateSession): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized: StoredCandidateSession = {
      ...session,
      referenceCode: session.referenceCode.trim().toUpperCase(),
      email: session.email.trim(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(SESSION_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function clearCandidateSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SESSION_EVENT));
  } catch {
    // ignore
  }
}

export function useCandidateSession(): StoredCandidateSession | null {
  const [session, setSession] = useState<StoredCandidateSession | null>(() =>
    getCandidateSession(),
  );

  useEffect(() => {
    const sync = () => setSession(getCandidateSession());
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEY) {
        sync();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(SESSION_EVENT, sync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SESSION_EVENT, sync);
    };
  }, []);

  return session;
}
