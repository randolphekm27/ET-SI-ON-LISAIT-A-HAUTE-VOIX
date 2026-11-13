import { Link } from 'react-router-dom';
import { usePageSeo } from '../lib/format';

export function MentionsLegalesPage() {
  usePageSeo(
    'Mentions légales',
    "Mentions légales du site officiel du concours culturel UCAEP à l'ENSET de Lokossa.",
  );

  return (
    <div className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <header className="space-y-3 border-b border-[#4E2A1E]/15 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Informations réglementaires
          </p>
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
              Le présent site est édité dans le cadre du concours culturel étudiant
              « Et si on lisait à haute voix ? », organisé par l&apos;UCAEP à
              l&apos;ENSET de Lokossa (Lokossa, Bénin).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Propriété intellectuelle
            </h2>
            <p>
              La marque, le logotype officiel de l&apos;UCAEP, les textes éditoriaux et
              les visuels publiés sur cette plateforme sont réservés à la communication
              officielle du concours. Toute reproduction ou altération sans autorisation
              du comité organisateur est interdite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Contact
            </h2>
            <p>
              Pour toute demande relative au site ou au règlement, vous pouvez utiliser
              le{' '}
              <Link to="/contact" className="text-[#4E2A1E] font-medium underline">
                formulaire de contact officiel
              </Link>
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
    'Traitement des données personnelles des candidats au concours UCAEP.',
  );

  return (
    <div className="py-16 lg:py-24 bg-[#FBF9F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <header className="space-y-3 border-b border-[#4E2A1E]/15 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2E4D32]">
            Données personnelles
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#4E2A1E]">
            Politique de confidentialité
          </h1>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-[#1A1A1A]/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Finalité de la collecte
            </h2>
            <p>
              Les informations recueillies via le formulaire d&apos;inscription
              (identité, coordonnées, filière, niveau d&apos;études, matricule et
              motivation) sont utilisées exclusivement pour la gestion des candidatures et
              la communication autour du concours « Et si on lisait à haute voix ? ».
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Stockage et sécurité
            </h2>
            <p>
              Les données soumises sont enregistrées de manière sécurisée par le système
              de gestion du concours (y compris la synchronisation avec les outils
              Google Forms et Google Sheets utilisés par le comité UCAEP). Elles ne sont
              jamais cédées à des tiers commerciaux.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#4E2A1E]">
              Vos droits
            </h2>
            <p>
              Vous pouvez demander la rectification ou la suppression de vos données de
              candidature à tout moment via la{' '}
              <Link to="/contact" className="text-[#4E2A1E] font-medium underline">
                page Contact
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
