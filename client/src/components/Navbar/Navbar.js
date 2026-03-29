'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar({ disabled = false }) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  // Handshake: Ensure the backend httpOnly cookie is set if NextAuth is logged in
  React.useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const syncBackend = async () => {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
          // Call /me to check if cookie is present; if not, call /sso to set it
          const res = await fetch(`${apiBase}/api/v1/auth/me`, { credentials: 'include' });
          if (res.status === 401) {
            console.log('[Auth] Syncing backend session cookie...');
            await fetch(`${apiBase}/api/v1/auth/sso`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                email: session.user.email,
                name: session.user.name,
                avatar: session.user.image,
                provider: 'google', // Default for sync
                providerId: session.user.id
              })
            });
          }
        } catch (err) {
          console.error('[Auth] Handshake failed:', err);
        }
      };
      syncBackend();
    }
  }, [status, session]);

  if (disabled) {
    return (
      <header className="fixed top-0 w-full z-50 bg-[#0b1326] flex justify-between items-center px-6 h-16 w-full border-b border-outline-variant/5">
        <Link href="/" className="text-lg font-bold tracking-tighter text-[#c0c1ff] font-headline">CognitiveLayer</Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-8 font-['Inter'] tracking-tight text-sm font-medium">
            <span className="text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-1">GEO Audit</span>
            <span className="text-slate-400 cursor-not-allowed">History</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-bright transition-all"
          >
            Cancel Audit
          </button>
        </div>
      </header>
    );
  }

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 w-full bg-[#0b1326]/80 backdrop-blur-md border-b border-outline-variant/5">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-lg font-bold tracking-tighter text-[#c0c1ff]">CognitiveLayer</Link>
        <div className="hidden md:flex items-center gap-6">
          <Link className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="/">GEO Audit</Link>
          <Link className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="/history">History</Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="h-8 w-16 bg-surface-container rounded-lg animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-on-surface-variant hidden sm:inline-block">
              {session.user?.name || session.user?.email}
            </span>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-surface-container-high text-on-surface text-sm font-medium rounded-lg hover:bg-surface-bright transition-all"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link 
            href="/login"
            className="px-4 py-2 bg-primary-container text-on-primary-container text-sm font-medium rounded-lg hover:bg-surface-bright transition-all duration-200"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
