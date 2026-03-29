'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Support custom ?redirect=x and NextAuth's native ?callbackUrl=x
  const redirectUrl = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/';

  // Sync mode if query param changes
  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'register' || qMode === 'login') {
      setMode(qMode);
    }
  }, [searchParams]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIsSuccess(false);

    try {
      if (mode === 'register') {
        const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Registration failed');
      } else {
        // Explicitly hit backend login first to get the httpOnly cookie in the browser
        const logRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005'}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
          credentials: 'include',
        });
        const logData = await logRes.json();
        if (!logRes.ok) throw new Error(logData.error || 'Login failed');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        throw new Error('Invalid email or password');
      } else {
        // Success sequence
        setIsSuccess(true);
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 300);
      }
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      if (!isSuccess) setLoading(false);
    }
  };

  return (
    <div className={`auth-card ${isShaking ? 'animate-shake' : ''}`}>
      {/* Brand Header */}
      <div className="mb-8">
        <h1 className="text-[16px] font-bold text-white tracking-tight">CognitiveLayer</h1>
        <p className="text-[13px] text-muted">Analyze your SEO & GEO visibility</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-6 mb-8 border-b border-white/5">
        <button 
          onClick={() => setMode('login')}
          className={`pb-2 text-sm font-medium transition-all relative ${mode === 'login' ? 'text-white' : 'text-muted hover:text-white/80'}`}
        >
          Sign in
          {mode === 'login' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
        </button>
        <button 
          onClick={() => setMode('register')}
          className={`pb-2 text-sm font-medium transition-all relative ${mode === 'register' ? 'text-white' : 'text-muted hover:text-white/80'}`}
        >
          Create account
          {mode === 'register' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
        </button>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Name</label>
            <input
              type="text"
              required
              disabled={loading}
              className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-sm text-white outline-none transition-all ${error ? 'border-error/50' : 'border-white/5 focus:border-primary/50'}`}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Email address</label>
          <input
            type="email"
            required
            disabled={loading}
            className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-sm text-white outline-none transition-all ${error ? 'border-error/50' : 'border-white/5 focus:border-primary/50'}`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              className={`w-full px-4 py-3 bg-surface-container-low border rounded-xl text-sm text-white outline-none transition-all ${error ? 'border-error/50' : 'border-white/5 focus:border-primary/50'}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {error && <p className="text-[12px] text-error mt-2 ml-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isSuccess ? 'success-pulse bg-success text-white' : 'bg-primary text-on-primary hover:brightness-110 disabled:opacity-50'}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : isSuccess ? (
            <span className="material-symbols-outlined">check</span>
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="px-3 bg-surface-container text-muted">or continue with</span>
        </div>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 py-3 px-4 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-medium text-white"
        >
          <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
          Google
        </button>
        <button
          onClick={() => signIn('github', { callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 py-3 px-4 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-medium text-white"
        >
          <img src="https://github.com/favicon.ico" className="w-3.5 h-3.5 brightness-200" alt="GitHub" />
          GitHub
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[90vh] p-6">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <AuthContent />
      </Suspense>
    </main>
  );
}
