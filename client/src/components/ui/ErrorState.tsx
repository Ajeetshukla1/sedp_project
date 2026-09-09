import { type ReactElement } from 'react';

export function ErrorState({
  message = 'Something went wrong.',
}: {
  message?: string;
}): ReactElement {
  return (
    <div className="error-state" role="alert">
      {message}
    </div>
  );
}
