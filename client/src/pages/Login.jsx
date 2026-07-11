import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

const DEMO_USERS = [
  { username: 'admin', password: 'Admin123!', role: 'Admin' },
  { username: 'farmacia', password: 'Pharma123!', role: 'Pharmacist' },
  { username: 'caja', password: 'Cashier123!', role: 'Cashier' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async (user, pass) => {
    setLoading(true);
    try {
      await login(user, pass);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(username, password);
  };

  const handleDemoLogin = (demo) => {
    setUsername(demo.username);
    setPassword(demo.password);
    doLogin(demo.username, demo.password);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-clinical-600" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold text-stone-900">
              Pharmacy Inventory
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Batch tracking · FEFO sales · Reports
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter username"
                autoFocus
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-16"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-stone-400">
                  Try a demo account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.username}
                  onClick={() => handleDemoLogin(demo)}
                  disabled={loading}
                  className="btn-secondary text-xs py-2 disabled:opacity-50"
                >
                  {demo.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}