import { Link } from 'react-router-dom';
import {
  BrandPatternCircle,
  BrandPatternSurface,
  BrandPatternWave,
} from '../components/BrandPattern';
import { DepotSubmissionPanel } from '../components/DepotSubmissionPanel';
import { PageFolioHeader } from '../components/EditorialMark';
import { EditorialReveal } from '../components/MotionPrimitives';
import { usePageSeo } from '../lib/format';
import { VideoPrepWorkshop } from '../components/VideoPrepWorkshop';

const DEPOT_STEPS = [
  {
    num: '01',
    verb: 'Identifiez-vous',
    detail: 'Saisissez votre code UCAEP-2026-XXXX et votre adresse e-mail d’inscription.',
  },
  {
    num: '02',
    verb: 'Préparez',
    detail: 'Vérifiez vos deux textes, le format vidéo (MP4, MOV, WebM) et la limite de 50 Mo.',
  },
  {
    num: '03',
    verb: 'Envoyez',
    detail: 'Déposez chaque texte séparément (et votre vidéo via le formulaire ou le lecteur prévu).',
  },
  {
    num: '04',
    verb: 'Consultez',
    detail: 'Suivez la validation du jury : chaque texte reste modifiable tant qu’il n’est pas validé.',
  },
];

export function DepotPage() {
  usePageSeo(
    'Déposer mes productions',
    'Espace candidat pour transmettre vos deux textes et vos fichiers vidéo ou audio pour les phases en ligne du concours UCAEP à l’ENSET de Lokossa.',
  );

  return (
    <div className="bg-ucaep-paper min-h-screen">
      <PageFolioHeader
        folio="Espace candidat"
        section="Dépôt et suivi · Phases en ligne"
        title="Déposer vos"
        italicWord="productions"
        subtitle="Connectez-vous avec votre code d’anonymat UCAEP et votre adresse e-mail pour soumettre vos travaux de La Plume ou de La Connaissance, suivre leur statut de relecture et accéder au calculateur de durée vidéo."
        patternVariant="green"
        quickFacts={[
          { label: 'Phases en ligne', value: 'La Plume · La Connaissance' },
          { label: 'Durée vidéo', value: "Jusqu'à 5 minutes" },
          { label: 'Formats acceptés', value: 'Texte · PDF/Word · Audio · Vidéo' },
          { label: 'Taille max fichier', value: '50 Mo par envoi' },
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
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {DEPOT_STEPS.map((item, idx) => (
              <EditorialReveal key={item.num} delay={idx * 0.06} y={14}>
                <div className="art-card h-full p-4 bg-white border border-ucaep-brown/14 rounded-[2px] space-y-1.5">
                  <span className="font-mono text-[11px] font-semibold text-ucaep-gold tabular-nums">
                    {item.num}
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-ucaep-brown">
                    {item.verb}
                  </h2>
                  <p className="text-xs text-ucaep-ink/78 leading-relaxed">{item.detail}</p>
                </div>
              </EditorialReveal>
            ))}
          </div>

          <EditorialReveal delay={0.1}>
            <DepotSubmissionPanel />
          </EditorialReveal>

          <EditorialReveal delay={0.08}>
            <div className="p-5 bg-ucaep-linen/65 border border-ucaep-brown/15 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-ucaep-ink/82">
              <p className="leading-relaxed">
                Un fichier échoue à l&apos;envoi ou vous avez transmis le mauvais document avant validation ? Modifiez-le directement tant qu&apos;il est en attente, ou contactez l&apos;équipe en indiquant votre code UCAEP.
              </p>
              <Link
                to="/contact"
                className="font-semibold text-ucaep-brown hover:text-ucaep-gold underline whitespace-nowrap shrink-0"
              >
                Contacter l&apos;équipe
              </Link>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.1}>
            <VideoPrepWorkshop />
          </EditorialReveal>
        </div>
      </section>
    </div>
  );
}
