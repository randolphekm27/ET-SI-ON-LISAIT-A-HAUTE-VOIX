import { SCENIC_ASSETS, type ScenicAssetKey } from '../lib/scenic-assets';

export type ScenicMotionKind =
  | 'monstera'
  | 'palmier'
  | 'hibiscus'
  | 'tamtam'
  | 'livres';

const PLAN_Z_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: 'z-[1]',
  2: 'z-[10]',
  3: 'z-[20]',
  4: 'z-[30]',
};

interface ScenicStageAssetProps {
  assetKey: ScenicAssetKey;
  /** Plan visuel strict (1 = fond, 2 = contenu, 3 = objet scénographique, 4 = masque) */
  plan?: 1 | 2 | 3 | 4;
  /** Identifiant d'animation GSAP ScrollTrigger */
  motionId?: ScenicMotionKind;
  /** Retourne horizontalement l'illustration pour l'orienter vers l'intérieur de la composition */
  flipX?: boolean;
  /** Classes de positionnement et de gabarit max relatives à la section hôte */
  className?: string;
  /** Classes appliquées directement à l'image (rotation initiale, opacité, etc.) */
  imgClassName?: string;
  priority?: boolean;
}

/**
 * Conteneur dédié pour les assets PNG scénographiques.
 * Garantit : aspect-ratio intact, object-fit: contain, z-index documenté,
 * marges de sécurité et aucune coupure involontaire.
 */
export function ScenicStageAsset({
  assetKey,
  plan = 3,
  motionId,
  flipX = false,
  className = '',
  imgClassName = '',
  priority = false,
}: ScenicStageAssetProps) {
  const meta = SCENIC_ASSETS[assetKey];
  const planClass = PLAN_Z_CLASSES[plan];

  return (
    <div
      aria-hidden="true"
      data-scenic-asset={assetKey}
      data-scenic-plan={plan}
      data-scenic-motion={motionId}
      className={`pointer-events-none select-none ${planClass} ${meta.aspect} ${className}`}
    >
      <div className={`w-full h-full ${flipX ? '-scale-x-100' : ''}`}>
        <img
          src={meta.src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`scenic-object w-full h-full object-contain ${imgClassName}`}
        />
      </div>
    </div>
  );
}
