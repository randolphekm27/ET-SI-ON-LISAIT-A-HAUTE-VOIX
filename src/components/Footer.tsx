import { Link } from 'react-router-dom';
import { UcaepMark } from './Header';

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-[#F7E6C8] border-t border-[#4E2A1E]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <UcaepMark light />
            </Link>
            <p className="text-sm text-[#F7E6C8]/75 max-w-sm leading-relaxed">
              « Et si on lisait à haute voix ? » — Concours culturel étudiant
              organisé par l&apos;UCAEP à l&apos;ENSET de Lokossa, Bénin.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#D19A3A]">
              Navigation
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-[#F7E6C8]/80">
              <li>
                <Link to="/concours" className="hover:text-[#FBF9F5] transition-colors">
                  Le concours
                </Link>
              </li>
              <li>
                <Link to="/parcours" className="hover:text-[#FBF9F5] transition-colors">
                  Le parcours
                </Link>
              </li>
              <li>
                <Link to="/annonces" className="hover:text-[#FBF9F5] transition-colors">
                  Annonces
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="hover:text-[#FBF9F5] transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link to="/inscription" className="hover:text-[#FBF9F5] transition-colors">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#FBF9F5] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-[#D19A3A]">
              Informations
            </h2>
            <ul className="space-y-2.5 text-sm text-[#F7E6C8]/80">
              <li>
                <Link to="/contact" className="hover:text-[#FBF9F5] transition-colors">
                  Contacter l&apos;organisation
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="hover:text-[#FBF9F5] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  to="/politique-de-confidentialite"
                  className="hover:text-[#FBF9F5] transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/gestion" className="hover:text-[#FBF9F5] transition-colors">
                  Espace organisateurs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#F7E6C8]/55">
          <p>© {new Date().getFullYear()} UCAEP — ENSET de Lokossa, Bénin.</p>
          <p>Écriture · Connaissance · Éloquence</p>
        </div>
      </div>
    </footer>
  );
}
