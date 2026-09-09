import { type ReactElement } from 'react';

export function Skeleton({ className = '' }: { className?: string }): ReactElement {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}
