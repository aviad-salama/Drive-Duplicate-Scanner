import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

const input = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-800">התחברות</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
      <input className={input} type="email" placeholder="אימייל" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input className={input} type="password" placeholder="סיסמה" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={busy}
        className="bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
        {busy ? 'מתחבר...' : 'התחבר'}
      </button>
      <p className="text-sm text-gray-500">
        אין לך חשבון? <Link to="/signup" className="text-blue-600">הרשם</Link>
      </p>
    </form>
  );
}