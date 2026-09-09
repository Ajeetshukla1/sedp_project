import { type ReactElement, type ReactNode } from 'react';

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}
