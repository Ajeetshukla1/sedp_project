import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application render error', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="not-found">
          <p className="eyebrow">Application error</p>
          <h1>Something needs attention.</h1>
          <p className="lede">This screen could not be loaded.</p>
          <Link to="/dashboard">Return to dashboard</Link>
        </div>
      );
    }

    return this.props.children;
  }
}
