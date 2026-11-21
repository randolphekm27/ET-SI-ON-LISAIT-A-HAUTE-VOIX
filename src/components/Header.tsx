import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { fetchApiJson } from '../lib/api';
import { useCandidateSession } from '../lib/candidate-session';
import { EDITORIAL_EASE } from '../lib/motion';
import { useSiteConfig } from '../lib/site-config';
import type { CompetitionPhase } from '../types/competition';

const MULTI_PAGE_NAV_ITEMS = [
  { to: '/concours', label: 'Le concours', num: '01' },
  { to: '/parcours', label: 'Le parcours', num: '02' },
  { to: '/annonces', label: 'Annonces', num: '03' },
  { to: '/actualites', label: 'Actualités', num: '04' },
  { to: '/faq', label: 'FAQ', num: '05' },
];

export function UcaepMark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap shrink-0 transition-transform duration-200 hover:scale-[1.02]">
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
  const candidateSession = useCandidateSession();
  const { siteConfig, activePhase } = useSiteConfig();
  const location = useLocation();
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll();
  const scrollScaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  const isSinglePageMode = siteConfig.mode === 'phase_single_page';
  const isPresentielPhase =
    activePhase?.format === 'En présentiel' || activePhase?.id === 'phase-3';
  const isPublicRoot =
    location.pathname === '/' ||
    (isSinglePageMode &&
      !['/gestion', '/mentions-legales', '/politique-de-confidentialite'].includes(
        location.pathname,
      ));

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
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const overDarkHero =
    location.pathname === '/' && !isSinglePageMode && !scrolled && !mobileOpen;
  const overIvoryHero =
    isSinglePageMode && isPublicRoot && !scrolled && !mobileOpen;

  const singlePageNavItems = [
    { id: 'phase-apercu', label: 'La phase', num: '01' },
    { id: 'comprendre-phase', label: 'Comprendre', num: '02' },
    { id: 'consignes', label: 'Consignes', num: '03' },
    {
      id: 'depot-production',
      label: isPresentielPhase ? 'Présentiel' : 'Dépôt',
      num: '04',
    },
    { id: 'informations', label: 'Annonces', num: '05' },
  ];

  function handleSectionJump(sectionId: string) {
    setMobileOpen(false);
    if (isPublicRoot) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          overDarkHero
            ? 'h-16 lg:h-[82px] bg-gradient-to-b from-[#0C0705]/88 via-[#0C0705]/58 to-[#0C0705]/10 backdrop-blur-[3px] border-b border-white/12 text-[#FBF9F5]'
            : overIvoryHero
              ? 'h-16 lg:h-[78px] bg-[#F7E6C8]/88 backdrop-blur-sm border-b border-[#4E2A1E]/14 text-[#4E2A1E]'
              : 'h-16 bg-ucaep-paper/95 backdrop-blur-md border-b border-ucaep-brown/14 text-ucaep-ink'
        }`}
      >
        <div className="w-full h-full px-4 sm:px-8 lg:px-14 flex items-center justify-between gap-8">
          {/* Zone 1: Brand mark */}
          <Link
            to="/"
            aria-label="Accueil — Et si on lisait à haute voix ?"
            className="whitespace-nowrap shrink-0 focus-visible:rounded-sm"
          >
            <UcaepMark light={overDarkHero} />
          </Link>

          {/* Zone 2: Navigation Links (Multi-page routes OR Single-page section anchors) */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-8 text-[13px] font-medium tracking-[0.04em]"
          >
            {isSinglePageMode
              ? singlePageNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSectionJump(item.id)}
                    className={`relative py-1.5 whitespace-nowrap shrink-0 editorial-underline transition-colors duration-150 ${
                      overIvoryHero
                        ? 'text-[#4E2A1E]/85 hover:text-[#4E2A1E]'
                        : 'text-ucaep-ink/75 hover:text-ucaep-brown'
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              : MULTI_PAGE_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative py-1.5 whitespace-nowrap shrink-0 editorial-underline transition-colors duration-150 ${
                        overDarkHero
                          ? isActive
                            ? 'text-white font-semibold'
                            : 'text-[#F7E6C8]/85 hover:text-white'
                          : overIvoryHero
                            ? isActive
                              ? 'text-[#4E2A1E] font-semibold'
                              : 'text-[#4E2A1E]/80 hover:text-[#4E2A1E]'
                            : isActive
                              ? 'text-ucaep-brown font-semibold'
                              : 'text-ucaep-ink/75 hover:text-ucaep-brown'
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

          {/* Zone 3: Strictly 1 Primary Action + Mobile Drawer Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {isSinglePageMode ? (
              <button
                type="button"
                onClick={() =>
                  handleSectionJump(isPresentielPhase ? 'consignes' : 'depot-production')
                }
                className={`hidden sm:inline-flex btn-tactile items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase rounded-[4px] whitespace-nowrap shrink-0 group ${
                  overIvoryHero
                    ? 'bg-ucaep-gold text-[#1A1A1A] hover:bg-[#c58d2e]'
                    : 'bg-ucaep-green text-ucaep-paper hover:bg-[#233d27]'
                }`}
              >
                <span>
                  {isPresentielPhase
                    ? 'Voir les consignes'
                    : candidateSession
                      ? 'Mon espace dépôt'
                      : 'Déposer ma production'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            ) : candidateSession ? (
              <Link
                to="/depot"
                title={`Dossier ${candidateSession.referenceCode}`}
                className={`hidden sm:inline-flex btn-tactile items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase rounded-[4px] whitespace-nowrap shrink-0 group ${
                  overDarkHero || overIvoryHero
                    ? 'bg-ucaep-gold text-[#1A120D] hover:bg-[#dfb05c]'
                    : 'bg-ucaep-green text-ucaep-paper hover:bg-[#233d27]'
                }`}
              >
                <span>Mon espace dépôt</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                to="/inscription"
                className={`hidden sm:inline-flex btn-tactile items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase rounded-[4px] whitespace-nowrap shrink-0 group ${
                  overDarkHero || overIvoryHero
                    ? 'bg-ucaep-gold text-[#1A120D] hover:bg-[#dfb05c]'
                    : 'bg-ucaep-brown text-ucaep-paper hover:bg-[#3a1f16]'
                }`}
              >
                <span>S&apos;inscrire</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm transition-colors active:scale-95 ${
                overDarkHero
                  ? 'text-[#F7E6C8] hover:bg-white/10'
                  : overIvoryHero
                    ? 'text-[#4E2A1E] hover:bg-[#4E2A1E]/8'
                    : 'text-ucaep-brown hover:bg-ucaep-brown/8'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Barre de progression de lecture pilotée par Motion (GPU scaleX) */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: scrollScaleX }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-ucaep-gold origin-left"
        />
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
                {isSinglePageMode && activePhase
                  ? `Phase ${activePhase.number} · ${activePhase.title}`
                  : 'Sommaire · ENSET de Lokossa'}
              </p>
              <nav
                aria-label="Menu mobile"
                className="divide-y divide-white/10 border-t border-b border-white/10"
              >
                {isSinglePageMode ? (
                  singlePageNavItems.map((item, idx) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        delay: 0.04 * idx,
                        ease: EDITORIAL_EASE,
                      }}
                      onClick={() => handleSectionJump(item.id)}
                      className="w-full flex items-baseline justify-between py-4 text-left text-ucaep-paper hover:text-ucaep-gold transition-colors"
                    >
                      <span className="font-serif text-3xl font-medium">{item.label}</span>
                      <span className="font-mono text-xs tabular-nums text-ucaep-ivory/55">
                        {item.num}
                      </span>
                    </motion.button>
                  ))
                ) : (
                  <>
                    <Link to="/" className="flex items-baseline justify-between py-4 group">
                      <span className="font-serif text-3xl font-medium text-ucaep-paper group-hover:text-ucaep-gold transition-colors">
                        Accueil
                      </span>
                      <span className="font-mono text-xs tabular-nums text-ucaep-gold/75">
                        00
                      </span>
                    </Link>
                    {MULTI_PAGE_NAV_ITEMS.map((item, idx) => (
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
                          <span className="font-serif text-3xl font-medium">
                            {item.label}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-ucaep-ivory/55">
                            {item.num}
                          </span>
                        </NavLink>
                      </motion.div>
                    ))}
                  </>
                )}
              </nav>
            </div>

            <div className="pt-8 space-y-3">
              {isSinglePageMode ? (
                <button
                  type="button"
                  onClick={() =>
                    handleSectionJump(isPresentielPhase ? 'consignes' : 'depot-production')
                  }
                  className="btn-tactile w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                >
                  <span>
                    {isPresentielPhase
                      ? 'Consulter le programme'
                      : 'Accéder à l’espace dépôt'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : candidateSession ? (
                <>
                  <p className="text-xs text-ucaep-ivory/75">
                    Candidat enregistré · Réf.{' '}
                    <span className="font-mono font-semibold text-ucaep-gold">
                      {candidateSession.referenceCode}
                    </span>
                  </p>
                  <Link
                    to="/depot"
                    className="btn-tactile w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                  >
                    <span>Accéder à mon espace candidat</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  {hasOpenSubmissions && (
                    <Link
                      to="/depot"
                      className="btn-tactile w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm border border-ucaep-gold text-ucaep-gold hover:bg-ucaep-gold/10"
                    >
                      <span>Déposer mes productions</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <Link
                    to="/inscription"
                    className="btn-tactile w-full py-3.5 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wider uppercase rounded-sm bg-ucaep-gold text-ucaep-ink hover:bg-[#c38c2d]"
                  >
                    <span>Commencer mon inscription</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
              <div className="flex items-center justify-between text-xs text-ucaep-ivory/65 pt-2">
                {isSinglePageMode ? (
                  <button
                    type="button"
                    onClick={() => handleSectionJump('informations')}
                    className="hover:text-ucaep-paper underline"
                  >
                    Contacter l&apos;organisation
                  </button>
                ) : (
                  <Link to="/contact" className="hover:text-ucaep-paper underline">
                    Contacter l&apos;organisation
                  </Link>
                )}
                <span className="tabular-nums">+229 01 68 62 46 00</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
