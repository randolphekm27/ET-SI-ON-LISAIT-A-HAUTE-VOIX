import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { fetchApiJson } from './api';
import type {
  CompetitionPhase,
  PublicAnnouncement,
  PublicSiteConfigPayload,
  SiteDisplayConfig,
} from '../types/competition';

interface SiteConfigContextValue {
  loading: boolean;
  siteConfig: SiteDisplayConfig;
  activePhase: CompetitionPhase | null;
  phasesSummary: PublicSiteConfigPayload['phasesSummary'];
  announcements: PublicAnnouncement[];
  refreshSiteConfig: () => Promise<void>;
}

const DEFAULT_SITE_CONFIG: SiteDisplayConfig = {
  mode: 'multi_page',
  activePhaseId: 'phase-1',
  customNotice: '',
};

const CACHE_KEY = 'ucaep_site_config_v1';

function readCachedPayload(): PublicSiteConfigPayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicSiteConfigPayload;
    if (parsed && parsed.siteConfig) return parsed;
  } catch {
    // ignore storage errors
  }
  return null;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  loading: false,
  siteConfig: DEFAULT_SITE_CONFIG,
  activePhase: null,
  phasesSummary: [],
  announcements: [],
  refreshSiteConfig: async () => {},
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<PublicSiteConfigPayload | null>(() =>
    readCachedPayload(),
  );
  const [loading, setLoading] = useState<boolean>(() => !readCachedPayload());

  const refreshSiteConfig = useCallback(async () => {
    try {
      const fresh = await fetchApiJson<PublicSiteConfigPayload>('/api/site-config');
      setPayload(fresh);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      } catch {
        // ignore storage errors
      }
    } catch {
      // keep existing payload or fallback defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSiteConfig();
  }, [refreshSiteConfig]);

  const value: SiteConfigContextValue = {
    loading,
    siteConfig: payload?.siteConfig || DEFAULT_SITE_CONFIG,
    activePhase: payload?.activePhase || null,
    phasesSummary: payload?.phasesSummary || [],
    announcements: payload?.announcements || [],
    refreshSiteConfig,
  };

  return (
    <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
