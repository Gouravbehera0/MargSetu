import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import Logo from '@/components/Logo';
import { useApp } from '@/context/AppContext';
import supabase from '@/lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setRole } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setNeedsConfirmation(false);
    setResendMsg(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // Check if email confirmation is required
          if (data.session === null) {
            setNeedsConfirmation(true);
            setError('Account created! Check your email for a confirmation link to activate your account before signing in.');
          } else {
            navigate('/roles');
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.toLowerCase().includes('email not confirmed') || signInError.message.toLowerCase().includes('not confirmed')) {
            setNeedsConfirmation(true);
            throw new Error('Your email address has not been confirmed yet. Check your inbox for a confirmation link, or resend it below.');
          }
          throw signInError;
        }
        navigate('/roles');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) throw resendError;
      setResendMsg('Confirmation link sent! Check your inbox (and spam folder).');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend. Please try again.';
      setResendMsg(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mobile-container flex flex-col bg-white">
      {/* Header */}
      <div className="bg-navy-800 px-6 pt-16 pb-12 rounded-b-3xl">
        <Logo size="md" variant="light" />
        <h1 className="text-3xl font-extrabold text-white mt-8">
          {mode === 'signin' ? 'Welcome Back!' : 'Create Account'}
        </h1>
        <p className="text-white/60 mt-1">
          {mode === 'signin'
            ? 'Sign in to stay connected during emergencies.'
            : 'Sign up to start using Emergency Connect.'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8">
        {error && (
          <div className="bg-emergency-50 border border-emergency-200 rounded-xl p-3 mb-4 animate-slide-down">
            <p className="text-sm text-emergency-700 font-medium">{error}</p>
          </div>
        )}

        {needsConfirmation && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <button
              onClick={handleResendConfirmation}
              disabled={resending || !email}
              className="text-sm text-blue-700 font-semibold active:scale-95 disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend confirmation link'}
            </button>
            {resendMsg && <p className="text-xs text-blue-600 mt-2">{resendMsg}</p>}
          </div>
        )}

        {mode === 'signup' && (
          <div className="mb-4">
            <label className="text-sm font-semibold text-navy-700 mb-2 block">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Amit Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>
        )}

        <label className="text-sm font-semibold text-navy-700 mb-2 block">Email</label>
        <div className="relative mb-4">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            placeholder="amit@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-11"
          />
        </div>

        <label className="text-sm font-semibold text-navy-700 mb-2 block">Password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-11"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Toggle mode */}
        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
          className="w-full mt-4 text-navy-600 font-semibold text-sm py-2 active:scale-95 transition-transform"
        >
          {mode === 'signin' ? "Don't have an account? Create Account" : 'Already have an account? Sign In'}
        </button>
      </div>

      {/* Emergency personnel */}
      <div className="px-6 pb-10">
        <button
          onClick={() => {
            setMode('signin');
            setError(null);
          }}
          className="w-full bg-navy-50 border border-navy-200 rounded-xl py-3 text-navy-700 font-semibold text-sm active:scale-[0.98] transition-all"
        >
          Emergency Personnel Login →
        </button>
      </div>
    </div>
  );
}
