import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { SignupFormData } from '../../../types/auth';
import { Title, Text } from '../../../components/ui/Typography';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { he } from '../../../languages/he';

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
      setError(err instanceof Error ? err.message : he.auth.signupError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Title level={1} className="text-2xl">{he.auth.signup}</Title>
      
      {error && <Alert variant="error" className="p-3 text-sm">{error}</Alert>}
      
      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          placeholder={he.auth.fullName}
          {...register('name', { required: 'Full name is required' })} 
        />
        {errors.name && <Text as="span" variant="danger" size="sm" className="px-1">{errors.name.message}</Text>}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          type="email" 
          placeholder={he.auth.email}
          {...register('email', { required: 'Email is required' })} 
        />
        {errors.email && <Text as="span" variant="danger" size="sm" className="px-1">{errors.email.message}</Text>}
      </div>

      <div className="flex flex-col gap-1">
        <input 
          className="form-input" 
          type="password" 
          placeholder={he.auth.passwordHint}
          {...register('password', { 
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' }
          })} 
        />
        {errors.password && <Text as="span" variant="danger" size="sm" className="px-1">{errors.password.message}</Text>}
      </div>

      <Button type="submit" disabled={busy} className="mt-2 w-full">
        {busy ? he.auth.signupBusy : he.auth.signupSubmit}
      </Button>
      
      <Text size="sm" variant="dimmed">
        {he.auth.alreadyHaveAccount} <Link to="/login" className="text-teal-700 dark:text-teal-300 font-semibold">{he.auth.loginLink}</Link>
      </Text>
    </form>
  );
}