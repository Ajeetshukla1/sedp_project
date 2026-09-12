import { type JSX, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
        </div>
        {action && (
          <Link to={action.to}>
            <Button>
              {action.label} <ArrowRight size={16} />
            </Button>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
