import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { LoginFormData } from '../../../types/auth';
import { Title, Text } from '../../../components/ui/Typography';
import { Button } from '../../../components/ui/button';
import { Alert } from '../../../components/ui/Alert';
import { Input } from '../../../components/ui/input';
import { he } from '../../../languages/he';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      setError(err instanceof Error ? err.message : he.auth.loginError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Title level={1} className="text-2xl">{he.auth.login}</Title>

      {error && <Alert variant="error" className="p-3 text-sm">{error}</Alert>}

      <div className="flex flex-col gap-1">
        <Input
          type="email"
          placeholder={he.auth.email}
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <Text as="span" variant="danger" size="sm" className="px-1">{errors.email.message}</Text>}
      </div>

      <div className="flex flex-col gap-1">
        <Input
          type="password"
          placeholder={he.auth.password}
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <Text as="span" variant="danger" size="sm" className="px-1">{errors.password.message}</Text>}
      </div>

      <Button type="submit" disabled={busy} className="mt-2 w-full">
        {busy ? he.auth.loginBusy : he.auth.loginSubmit}
      </Button>

      <Text size="sm" variant="dimmed">
        {he.auth.noAccount} <Link to="/signup" className="text-teal-700 dark:text-teal-300 font-semibold">{he.auth.register}</Link>
      </Text>
    </form>
  );
}
