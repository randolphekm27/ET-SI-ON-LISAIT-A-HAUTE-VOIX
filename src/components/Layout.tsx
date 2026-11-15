import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'motion/react';
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

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

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
      {/* Subtle 2px reading depth line across top of viewport */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-ucaep-gold origin-left z-[60] pointer-events-none"
      />
      <Header />
      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full flex-1 ${isFullBleedHero ? '' : 'pt-16'}`}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}
