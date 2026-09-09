import { type ReactElement, type ReactNode } from 'react';

export function Badge({
  children,
  tone = 'teal',
}: {
  children: ReactNode;
  tone?: 'teal' | 'gold' | 'slate';
}): ReactElement {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
