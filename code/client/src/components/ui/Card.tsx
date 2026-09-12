import { type HTMLAttributes, type ReactElement } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <section className={`card ${className}`} {...props} />;
}
