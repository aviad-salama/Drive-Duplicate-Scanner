import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { SignupFormData } from '../../../types/auth';

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>();

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setBusy(true);
    setError('');
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרשמה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">הרשמה</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
      
      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          placeholder="שם מלא" 
          {...register('name', { required: 'Full name is required' })} 
        />
        {errors.name && <span className="text-red-500 text-sm px-1">{errors.name.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          type="email" 
          placeholder="אימייל" 
          {...register('email', { required: 'Email is required' })} 
        />
        {errors.email && <span className="text-red-500 text-sm px-1">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          type="password" 
          placeholder="סיסמה (לפחות 8 תווים)" 
          {...register('password', { 
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' }
          })} 
        />
        {errors.password && <span className="text-red-500 text-sm px-1">{errors.password.message}</span>}
      </div>

      <button disabled={busy}
        className="bg-teal-600 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 mt-2 transition-colors">
        {busy ? 'נרשם...' : 'צור חשבון'}
      </button>
      
      <p className="text-sm text-gray-500 dark:text-slate-400">
        כבר יש לך חשבון? <Link to="/login" className="text-teal-700 dark:text-teal-300 font-semibold">התחבר</Link>
      </p>
    </form>
  );
}