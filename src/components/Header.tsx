import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { fetchApiJson } from '../lib/api';
import type { CompetitionPhase } from '../types/competition';

const NAV_ITEMS = [
  { to: '/concours', label: 'Le concours', num: '01' },
  { to: '/parcours', label: 'Le parcours', num: '02' },
  { to: '/annonces', label: 'Annonces', num: '03' },
  { to: '/actualites', label: 'Actualités', num: '04' },
  { to: '/faq', label: 'FAQ', num: '05' },
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
  const [hasOpenSubmissions, setHasOpenSubmissions] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    fetchApiJson<{ phases: CompetitionPhase[] }>('/api/phases')
      .then((res) => {
        if (!active) return;
        const anyOpen = (res.phases || []).some((p) => Boolean(p.submissionsOpen));
        setHasOpenSubmissions(anyOpen);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const overDarkHero = isHome && !scrolled && !mobileOpen;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          overDarkHero
            ? 'h-16 lg:h-[76px] bg-gradient-to-b from-[#341910]/92 via-[#4E2A1E]/65 to-transparent text-ucaep-paper'
            : 'h-16 bg-ucaep-paper/95 backdrop-blur-md border-b border-ucaep-brown/14 text-ucaep-ink'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-8 ${
            overDarkHero ? 'border-b border-ucaep-ivory/14' : ''
          }`}
        >
          {/* Zone 1: Brand mark */}
          <Link
            to="/"
            aria-label="Accueil — Et si on lisait à haute voix ?"
            className="whitespace-nowrap shrink-0 focus-visible:rounded-sm"
          >
            <UcaepMark light={overDarkHero} />
          </Link>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-8 text-[13px] font-medium tracking-[0.04em]"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-1.5 whitespace-nowrap shrink-0 editorial-underline transition-colors duration-150 ${
                    overDarkHero
                      ? isActive
                        ? 'text-ucaep-ivory font-semibold'
                        : 'text-ucaep-paper/78 hover:text-ucaep-ivory'
                      : isActive
                        ? 'text-ucaep-brown font-semibold'
                        : 'text-ucaep-ink/72 hover:text-ucaep-brown'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-rule"
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-ucaep-gold"
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Primary CTA (+ Deposit link when a phase is open) + mobile drawer button */}
          <div className="flex items-center gap-3 shrink-0">
            {hasOpenSubmissions && (
              <Link
                to="/depot"
                className={`hidden md:inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold tracking-wider uppercase rounded-[2px] border transition-colors whitespace-nowrap shrink-0 ${
                  overDarkHero
                    ? 'border-ucaep-gold/60 text-ucaep-gold hover:bg-ucaep-gold/10'
                    : 'border-ucaep-green/40 text-ucaep-green hover:bg-ucaep-green/8'
                }`}
              >
                Déposer ma production
              </Link>
            )}
            <Link
              to="/inscription"
              className={`hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase rounded-[2px] transition-colors duration-150 whitespace-nowrap shrink-0 group ${
                overDarkHero
                  ? 'bg-ucaep-gold text-[#14100E] hover:bg-[#e1ae52]'
                  : 'bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]'
              }`}
            >
              <span>S&apos;inscrire</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm transition-colors ${
                overDarkHero
                  ? 'text-ucaep-paper hover:bg-white/10'
                  : 'text-ucaep-brown hover:bg-ucaep-brown/8'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen Editorial Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden bg-ucaep-ink text-ucaep-paper pt-20 pb-8 px-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-6 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
                Sommaire · ENSET Lokossa
              </p>
              <nav aria-label="Menu mobile" className="divide-y divide-white/10 border-t border-b border-white/10">
                <Link
                  to="/"
                  className="flex items-baseline justify-between py-4 group"
                >
                  <span className="font-serif text-3xl font-medium text-ucaep-paper group-hover:text-ucaep-gold transition-colors">
                    Accueil
                  </span>
                  <span className="text-xs tabular-nums text-ucaep-gold/75">00</span>
                </Link>
                {NAV_ITEMS.map((item, idx) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: 0.04 * idx,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-baseline justify-between py-4 transition-colors ${
                          isActive
                            ? 'text-ucaep-gold'
                            : 'text-ucaep-paper hover:text-ucaep-gold'
                        }`
                      }
                    >
                      <span className="font-serif text-3xl font-medium">{item.label}</span>
                      <span className="text-xs tabular-nums text-ucaep-ivory/55">
                        {item.num}
                      </span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </div>

            <div className="pt-8 space-y-3">
              {hasOpenSubmissions && (
                <Link
                  to="/depot"
                  className="w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm border border-ucaep-gold text-ucaep-gold hover:bg-ucaep-gold/10 transition-colors"
                >
                  <span>Déposer ma production</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                to="/inscription"
                className="w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d] transition-colors"
              >
                <span>Je m&apos;inscris au concours</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center justify-between text-xs text-ucaep-ivory/65 pt-2">
                <Link to="/contact" className="hover:text-ucaep-paper underline">
                  Nous écrire
                </Link>
                <span className="tabular-nums">+229 01 68 62 46 00</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
