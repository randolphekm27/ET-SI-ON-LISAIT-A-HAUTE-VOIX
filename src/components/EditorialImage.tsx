import { useState } from 'react';
import { getMediaAsset, type ExtendedMediaKey } from '../lib/images';

interface EditorialImageProps {
  assetKey: ExtendedMediaKey | string;
  altOverride?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export function EditorialImage({
  assetKey,
  altOverride,
  className = '',
  imgClassName = '',
  priority = false,
}: EditorialImageProps) {
  const [hasError, setHasError] = useState(false);
  const asset = getMediaAsset(assetKey);
  const alt = altOverride || asset.alt;

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-ucaep-brown/10 text-ucaep-brown p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ucaep-gold mb-2">
          UCAEP · Archives
        </span>
        <span className="font-serif text-base italic max-w-xs">{asset.caption}</span>
      </div>
    );
  }

  return (
    <img
      src={asset.src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover ${imgClassName} ${className}`}
    />
  );
}
