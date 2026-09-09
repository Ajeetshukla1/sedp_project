import { useState, type FormEvent, type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type LoginRole } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export function LoginPage(): JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<LoginRole>('patient');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Careframe</p>
        <h1>Welcome back.</h1>
        <p className="lede">Choose your workspace to sign in.</p>
        <div className="login-role-selector" aria-label="Sign in as">
          <button
            type="button"
            className={role === 'patient' ? 'login-role-active' : ''}
            onClick={() => setRole('patient')}
            aria-pressed={role === 'patient'}
          >
            Patient
          </button>
          <button
            type="button"
            className={role === 'doctor' ? 'login-role-active' : ''}
            onClick={() => setRole('doctor')}
            aria-pressed={role === 'doctor'}
          >
            Doctor
          </button>
        </div>
        <form className="form-stack" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Email
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="form-note">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
