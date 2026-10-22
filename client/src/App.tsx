import {
  BrowserRouter, Navigate, Route, Routes,
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext'; // <-- ADDED
import AuthLayout from './routes/auth/AuthLayout';
import LoginPage from './routes/auth/login/LoginPage';
import SignupPage from './routes/auth/signup/SignupPage';
import DashboardPage from './routes/dashboard/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider> {/* <-- ADDED */}
        <AuthProvider>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
