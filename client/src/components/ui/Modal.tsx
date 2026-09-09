import { type JSX, type ReactNode } from 'react';
export function Modal({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="modal" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
