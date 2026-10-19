import { cn } from '@/utils/cn';
import { normalizeImageUrl } from '@/utils/imageValidation';

interface AvatarProps {
  name: string;
  image?: string;
  className?: string;
}

export function Avatar({ name, image, className }: AvatarProps) {
  const localImage = normalizeImageUrl(image);

  return (
    <div className={cn('flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200', className)}>
      {localImage ? <img src={localImage} alt={name} className="h-full w-full object-cover" /> : <span>{name.slice(0, 2).toUpperCase()}</span>}
    </div>
  );
}
