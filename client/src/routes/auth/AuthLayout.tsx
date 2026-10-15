import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4" dir="rtl">
      <Card padding="lg" className="w-full max-w-md shadow-xl shadow-teal-950/5 dark:shadow-black/20">
        <Outlet />
      </Card>
    </div>
  );
}
