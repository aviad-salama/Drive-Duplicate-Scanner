import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { LoginFormData } from '../../../types/auth';

const input = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setBusy(true);
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-800">התחברות</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
      
      <div className="flex flex-col gap-1">
        <input 
          className={input} 
          type="email" 
          placeholder="אימייל" 
          {...register('email', { required: 'Email is required' })} 
        />
        {errors.email && <span className="text-red-500 text-sm px-1">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          className={input} 
          type="password" 
          placeholder="סיסמה" 
          {...register('password', { required: 'Password is required' })} 
        />
        {errors.password && <span className="text-red-500 text-sm px-1">{errors.password.message}</span>}
      </div>

      <button disabled={busy}
        className="bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 mt-2">
        {busy ? 'מתחבר...' : 'התחבר'}
      </button>
      
      <p className="text-sm text-gray-500">
        אין לך חשבון? <Link to="/signup" className="text-blue-600">הרשם</Link>
      </p>
    </form>
  );
}