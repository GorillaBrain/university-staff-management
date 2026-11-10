'use client';
import { useState, type FormEvent } from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';
export default function LoginForm() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: String(form.get('email')).trim(), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Sign-in failed.'); setPending(false); return; }
      location.assign('/dashboard');
    } catch { setError('Unable to reach the server. Please try again.'); setPending(false); }
  }
  return <main className="login-page"><form className="login-card" onSubmit={login}>
    <div className="login-logo"><GraduationCap size={31} /><b>USMS</b></div>
    <h1>Welcome back</h1><p>Sign in to University Staff Management.</p>
    <label>Email address<input name="email" type="email" autoComplete="username" required maxLength={150} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={72} /></label>
    {error && <p className="error-text" role="alert">{error}</p>}
    <button className="button primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}<ArrowRight size={16} /></button>
    <p className="login-support">For account access, contact your university HR administrator.</p>
  </form></main>;
}
