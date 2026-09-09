import { forwardRef, type InputHTMLAttributes, type ReactElement } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref): ReactElement {
    return <input ref={ref} className={`input ${className}`} {...props} />;
  },
);
