import { type JSX, type ReactNode } from 'react';
export function Table({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}
