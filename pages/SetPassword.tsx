import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Lock, Loader, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../config/api';

type LandlordInviteStatus =
  | 'pending'
  | 'already_registered'
  | 'used'
  | 'expired'
  | 'invalid';

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<LandlordInviteStatus | 'checking'>('checking');
  const [inviteMessage, setInviteMessage] = useState('');

  const missingParams = useMemo(() => !token || !email, [token, email]);

  useEffect(() => {
    if (missingParams) {
      setInviteStatus('invalid');
      return;
    }

    let cancelled = false;
    setInviteStatus('checking');

    void (async () => {
      try {
        const response = await api.get(
          `/admin/landlord-invitation-status?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim().toLowerCase())}`
        );
        const status = (response?.data?.status || response?.status) as LandlordInviteStatus | undefined;
        if (!cancelled) {
          setInviteStatus(status || 'pending');
          setInviteMessage(response?.data?.message || response?.message || '');
        }
      } catch (err: any) {
        if (cancelled) return;
        const message = String(err?.message || '');
        if (message.includes('status: 404')) {
          setInviteStatus('pending');
          return;
        }
        setInviteStatus('invalid');
        setInviteMessage(message || 'Could not check this invitation.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missingParams, token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/set-landlord-password', {
        token,
        email: email.trim().toLowerCase(),
        newPassword: password,
      });

      if (response.success) {
        setSuccess(response.message || 'Password set successfully. You can now log in.');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(response.message || 'Failed to set password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-6">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/60">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Set Your Password</h1>
            <p className="text-gray-600 text-sm">Complete your Asher landlord account setup</p>
          </div>

          {(missingParams || (inviteStatus !== 'pending' && inviteStatus !== 'checking' && !success)) && (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {inviteMessage ||
                    'This invitation link is invalid, expired, or has already been used. Sign in if you already have an account, or ask your admin for a new invite.'}
                </p>
              </div>
              {(inviteStatus === 'already_registered' || inviteStatus === 'used') && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-200"
                >
                  Go to login
                </button>
              )}
            </div>
          )}

          {inviteStatus === 'checking' && !missingParams && (
            <div className="mb-6 flex items-center justify-center gap-2 text-gray-600">
              <Loader className="animate-spin" size={20} />
              <p className="text-sm">Checking invitation…</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {!missingParams && !success && inviteStatus === 'pending' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm bg-white/50 text-gray-600"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="glass-input w-full pl-12 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter a new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="glass-input w-full pl-12 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Saving password...</span>
                  </>
                ) : (
                  <span>Set Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
