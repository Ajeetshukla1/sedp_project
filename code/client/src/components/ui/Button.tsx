import { type ButtonHTMLAttributes, type ReactElement } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps): ReactElement {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
