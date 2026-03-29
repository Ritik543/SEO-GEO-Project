'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?mode=register');
  }, [router]);

  return <div className="min-h-screen bg-background flex items-center justify-center text-muted">Redirecting...</div>;
}
