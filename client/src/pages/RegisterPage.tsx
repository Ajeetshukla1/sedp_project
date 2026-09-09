import { useState, type FormEvent, type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type LoginRole } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage(): JSX.Element {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await register(name, email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Careframe</p>
        <h1>Create your account.</h1>
        <p className="lede">Set up a development workspace for synthetic records.</p>
        <div className="login-role-selector" aria-label="Create account as">
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
            Full name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Dr. Janvi Joshi"
              required
            />
          </label>
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
              placeholder="Choose a password"
              minLength={8}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="form-note">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
