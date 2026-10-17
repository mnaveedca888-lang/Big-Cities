import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface PageEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageEmptyState({ title, description, action }: PageEmptyStateProps) {
  return <EmptyState title={title} description={description} action={action} />;
}
