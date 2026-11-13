import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/concours', label: 'Le concours' },
  { to: '/parcours', label: 'Le parcours' },
  { to: '/annonces', label: 'Annonces' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/faq', label: 'FAQ' },
];

export function UcaepMark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap shrink-0">
      <img
        src={
          light
            ? '/assets/aistudio/Fichier_3300x-8_bbec6aad.png'
            : '/assets/aistudio/Fichier_6300x-8_cf8d966b.png'
        }
        alt="UCAEP — Union Culturelle et Artistique des Élèves-Professeurs"
        className="h-9 sm:h-10 w-auto object-contain"
      />
    </span>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const overHero = isHome && !scrolled && !mobileOpen;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 h-16 transition-colors duration-200 ${
        overHero
          ? 'bg-gradient-to-b from-[#1A1A1A]/75 to-transparent text-[#FBF9F5]'
          : 'bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#4E2A1E]/12 text-[#1A1A1A]'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand mark */}
        <Link
          to="/"
          aria-label="Accueil — Concours UCAEP"
          className="whitespace-nowrap shrink-0 focus-visible:rounded-sm"
        >
          <UcaepMark light={overHero} />
        </Link>

        {/* Zone 2: Desktop navigation */}
        <nav
          aria-label="Navigation principale"
          className="hidden lg:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  overHero
                    ? isActive
                      ? 'text-[#D19A3A]'
                      : 'text-[#FBF9F5]/90 hover:text-[#FBF9F5]'
                    : isActive
                      ? 'text-[#4E2A1E] font-semibold'
                      : 'text-[#1A1A1A]/75 hover:text-[#4E2A1E]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#D19A3A]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/inscription"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-xs font-semibold tracking-wider uppercase rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            S&apos;inscrire
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm transition-colors ${
              overHero
                ? 'text-[#FBF9F5] hover:bg-white/10'
                : 'text-[#4E2A1E] hover:bg-[#4E2A1E]/8'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile animated drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-[#FBF9F5] text-[#1A1A1A] border-b border-[#4E2A1E]/15 shadow-lg"
          >
            <nav
              aria-label="Menu mobile"
              className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-1"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-3 text-base font-medium rounded-sm transition-colors ${
                      isActive
                        ? 'bg-[#F7E6C8]/65 text-[#4E2A1E] font-semibold'
                        : 'text-[#1A1A1A]/85 hover:bg-[#F7E6C8]/35'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="pt-3 mt-2 border-t border-[#4E2A1E]/10 flex flex-col gap-2">
                <Link
                  to="/inscription"
                  className="w-full py-3 px-5 text-center text-sm font-semibold tracking-wider uppercase rounded-sm bg-[#D19A3A] text-[#1A1A1A] hover:bg-[#c38c2d] transition-colors"
                >
                  S&apos;inscrire
                </Link>
                <Link
                  to="/contact"
                  className="w-full py-2.5 px-5 text-center text-sm font-medium text-[#4E2A1E] hover:underline"
                >
                  Contact
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
