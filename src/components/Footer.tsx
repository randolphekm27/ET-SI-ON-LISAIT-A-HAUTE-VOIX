import { Link } from 'react-router-dom';
import { UcaepMark } from './Header';

export function Footer() {
  return (
    <footer className="bg-[#161210] text-ucaep-ivory border-t border-ucaep-brown/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/12">
          <div className="md:col-span-5 space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ucaep-gold">
              Édition 2026 · ENSET de Lokossa
            </p>
            <div className="flex items-center gap-5 pt-1">
              <Link to="/" className="inline-block shrink-0">
                <UcaepMark light />
              </Link>
              <img
                src="/assets/aistudio/LOGO_CONCOURS_8664fa5e.png"
                alt="Logo du concours Et si on lisait à haute voix ? 2026"
                className="h-12 w-auto object-contain shrink-0"
              />
            </div>
            <p className="text-sm text-ucaep-ivory/75 max-w-sm leading-relaxed">
              Un concours imaginé par l&apos;UCAEP pour les étudiants de l&apos;ENSET de
              Lokossa. On y écrit, on échange des idées et on lit à haute voix.
            </p>
            <p className="text-xs text-ucaep-ivory/65 tabular-nums">
              +229 01 68 62 46 00 · ucaeplokossa@gmail.com
            </p>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
              Le site
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-ucaep-ivory/80">
              <li>
                <Link to="/concours" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Le concours
                </Link>
              </li>
              <li>
                <Link to="/parcours" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Le parcours
                </Link>
              </li>
              <li>
                <Link to="/annonces" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Annonces
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link to="/inscription" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/faq" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ucaep-gold">
              En plus
            </h2>
            <ul className="space-y-3 text-sm text-ucaep-ivory/80">
              <li>
                <Link to="/contact" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Nous écrire
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  to="/politique-de-confidentialite"
                  className="editorial-underline hover:text-ucaep-paper transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/gestion" className="editorial-underline hover:text-ucaep-paper transition-colors">
                  Espace organisateurs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ucaep-ivory/55">
          <p>© {new Date().getFullYear()} UCAEP — ENSET de Lokossa, Bénin.</p>
          <p className="font-serif italic text-sm text-ucaep-ivory/75">
            La Plume · La Connaissance · L&apos;Éloquence
          </p>
        </div>
      </div>
    </footer>
  );
}
