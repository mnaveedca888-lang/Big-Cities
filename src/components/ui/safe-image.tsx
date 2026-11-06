import { useEffect, useMemo, useState } from 'react';
import { normalizeImageUrl } from '@/utils/imageValidation';

type SafeImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackSrc?: string | null;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export function SafeImage({ src, alt, className, fallbackClassName, fallbackSrc, loading, decoding, fetchPriority }: SafeImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageUrl(src), [src]);
  const normalizedFallbackSrc = useMemo(() => normalizeImageUrl(fallbackSrc), [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState<string | null>(normalizedSrc ?? normalizedFallbackSrc);
  const [errorCount, setErrorCount] = useState(0);

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
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
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
