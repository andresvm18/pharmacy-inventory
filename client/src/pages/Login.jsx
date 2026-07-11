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
    <div className="min-h-screen bg-gradient-to-br from-pharmacy-50 to-pharmacy-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💊</div>
          <h1 className="text-3xl font-bold text-pharmacy-700">
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Batch tracking · FEFO sales · Reports
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
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
            <label htmlFor="password" className="block text-sm font-medium mb-2">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-500">
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
                className="btn-secondary text-sm py-2 disabled:opacity-50"
              >
                {demo.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}