import { type JSX } from 'react';
import { Link } from 'react-router-dom';
export function NotFoundPage(): JSX.Element {
  return (
    <div className="not-found">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <Link to="/dashboard">Return to dashboard</Link>
    </div>
  );
}
