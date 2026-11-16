import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { PageFolioHeader } from '../components/EditorialMark';
import { usePageSeo } from '../lib/format';

import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';

export function DepotPage() {
  usePageSeo(
    'Déposer ma production',
    'Espace de dépôt des textes, contenus explicatifs, fichiers audio ou vidéos pour les phases en ligne du concours UCAEP à l’ENSET de Lokossa.',
  );

  return (
    <div className="bg-ucaep-paper min-h-screen">
      <PageFolioHeader
        folio="Dépôt"
        section="Espace candidat · Phases en ligne"
        title="Déposer votre"
        italicWord="production"
        subtitle="Accédez à votre dossier à l’aide de votre code d’anonymat UCAEP et de votre adresse e-mail afin de transmettre vos travaux pour les phases en ligne (La Plume et La Connaissance)."
        patternVariant="green"
        quickFacts={[
          { label: 'Phases en ligne', value: 'La Plume · La Connaissance' },
          { label: 'Présentation', value: "Jusqu'à 5 minutes" },
          { label: 'Formats', value: 'PDF · Word · Audio · Vidéo · Texte' },
          { label: 'Taille limite', value: '50 Mo par envoi' },
        ]}
      />

      <section className="relative py-14 lg:py-20 bg-ucaep-paper paper-fiber overflow-hidden">
        <BrandPatternSurface
          variant="green"
          tileWidth={220}
          opacityClass="opacity-[0.04]"
          blendMultiply
        />
        <BrandPatternCircle
          variant="green"
          tileWidth={135}
          blendMultiply
          doubleRing
          orbit
          className="hidden lg:block -bottom-24 -right-16 w-64 h-64 opacity-[0.08]"
        />
        <BrandPatternWave
          variant="green"
          tileWidth={170}
          opacity={0.085}
          doubleWave
          className="absolute bottom-0 inset-x-0 h-16"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <DepotSubmissionPanel />
          <VideoPrepWorkshop />
        </div>
      </section>
    </div>
  );
}
