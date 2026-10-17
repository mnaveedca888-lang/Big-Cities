import { useEffect, useMemo, useState } from 'react';
import { getFallbackImageUrl, normalizeImageUrl } from '@/utils/imageValidation';

type SafeImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackSrc?: string | null;
};

export function SafeImage({ src, alt, className, fallbackClassName, fallbackSrc }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  const normalizedSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const normalizedFallbackSrc = useMemo(() => normalizeImageUrl(fallbackSrc), [fallbackSrc]);

  if (import.meta.env.DEV) {
    console.log('[SafeImage] props', { src, normalizedSrc, fallbackSrc, normalizedFallbackSrc });
  }

  useEffect(() => {
    setErrorCount(0);
    if (normalizedSrc) {
      setCurrentSrc(normalizedSrc);
    } else if (normalizedFallbackSrc) {
      setCurrentSrc(normalizedFallbackSrc);
    } else {
      setCurrentSrc(null);
    }
  }, [normalizedSrc, normalizedFallbackSrc]);

  if (!currentSrc) {
    return (
      <div className={fallbackClassName ?? 'flex h-64 w-full items-center justify-center bg-slate-100 text-sm text-slate-500'}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={['block object-cover object-center', className].filter(Boolean).join(' ')}
      onError={() => {
        if (errorCount > 0) return;
        setErrorCount((count) => count + 1);

        if (normalizedSrc && normalizedFallbackSrc && currentSrc !== normalizedFallbackSrc) {
          setCurrentSrc(normalizedFallbackSrc);
          return;
        }

        setCurrentSrc(null);
        if (import.meta.env.DEV) {
          console.warn('[safe-image] failed to load', currentSrc ?? normalizedSrc ?? src);
        }
      }}
    />
  );
}
