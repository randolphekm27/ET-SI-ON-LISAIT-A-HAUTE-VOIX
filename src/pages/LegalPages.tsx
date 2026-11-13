import { Link } from 'react-router-dom';
import { EditorialMark } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';

export function MentionsLegalesPage() {
  usePageSeo(
    'Mentions légales',
    "Mentions légales du site du concours culturel UCAEP à l'ENSET de Lokossa.",
  );

  return (
    <div className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <header className="space-y-4 border-b border-[#4E2A1E]/15 pb-6">
          <EditorialMark folio="Cadre" label="Informations légales" tone="green" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
            Mentions légales
          </h1>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-[#1A1A1A]/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Éditeur du site
            </h2>
            <p>
              Ce site est édité pour le concours culturel étudiant « Et si on lisait à
              haute voix ? », organisé par l&apos;UCAEP (Union Culturelle et Artistique
              des Élèves-Professeurs) à l&apos;ENSET de Lokossa, Département du Mono,
              Bénin.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Propriété intellectuelle
            </h2>
            <p>
              Le nom, le logo de l&apos;UCAEP, les logos du concours, les textes et les
              visuels publiés sur ce site sont réservés à la communication du concours.
              Toute reproduction ou modification sans accord de l&apos;équipe
              organisatrice est interdite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Contact
            </h2>
            <p>
              Pour toute question sur le site ou l&apos;organisation du concours, vous
              pouvez passer par la{' '}
              <Link to="/contact" className="text-[#4E2A1E] font-medium underline">
                page Contact
              </Link>{' '}
              ou écrire à{' '}
              <a
                href="mailto:ucaeplokossa@gmail.com"
                className="text-[#4E2A1E] font-medium underline"
              >
                ucaeplokossa@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PolitiqueConfidentialitePage() {
  usePageSeo(
    'Politique de confidentialité',
    "Gestion des données personnelles recueillies lors de l'inscription au concours UCAEP.",
  );

  return (
    <div className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <header className="space-y-4 border-b border-[#4E2A1E]/15 pb-6">
          <EditorialMark folio="Confidentialité" label="Données personnelles" tone="green" />
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
            Politique de confidentialité
          </h1>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-[#1A1A1A]/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Utilisation des informations recueillies
            </h2>
            <p>
              Les informations demandées dans le formulaire d&apos;inscription (identité,
              coordonnées, filière, niveau d&apos;études, matricule et motivation) servent
              uniquement à gérer les inscriptions et à vous tenir informé du déroulement
              du concours « Et si on lisait à haute voix ? ».
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Enregistrement et confidentialité
            </h2>
            <p>
              Les données transmises sont conservées par l&apos;équipe organisatrice de
              l&apos;UCAEP (y compris via la synchronisation avec la feuille Google Sheets
              liée au suivi des inscriptions). Elles ne sont ni vendues ni transmises à
              des tiers extérieurs au concours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Vos droits
            </h2>
            <p>
              Vous pouvez demander à modifier ou supprimer vos informations
              d&apos;inscription à tout moment via la{' '}
              <Link to="/contact" className="text-[#4E2A1E] font-medium underline">
                page Contact
              </Link>{' '}
              ou par e-mail à{' '}
              <a
                href="mailto:ucaeplokossa@gmail.com"
                className="text-[#4E2A1E] font-medium underline"
              >
                ucaeplokossa@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
