import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { getMediaAsset } from '../lib/images';
import type { MediaAssetKey } from '../types/competition';

interface EditorialImageProps {
  assetKey: MediaAssetKey | string;
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
        className={`relative flex flex-col items-center justify-center bg-[#4E2A1E]/10 text-[#4E2A1E] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-8 h-8 mb-3 opacity-60" strokeWidth={1.5} />
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
