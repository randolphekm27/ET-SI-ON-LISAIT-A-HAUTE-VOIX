import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { EDITORIAL_EASE } from '../lib/motion';
import { useSiteConfig } from '../lib/site-config';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { siteConfig } = useSiteConfig();

  const isSinglePageMode = siteConfig.mode === 'phase_single_page';
  const isFullBleedHero =
    pathname === '/' ||
    (isSinglePageMode &&
      !['/gestion', '/mentions-legales', '/politique-de-confidentialite'].includes(
        pathname,
      ));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'g') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        navigate('/gestion');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-ucaep-paper text-ucaep-ink">
      <Header />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
        className={`w-full flex-1 ${isFullBleedHero ? '' : 'pt-16'}`}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
