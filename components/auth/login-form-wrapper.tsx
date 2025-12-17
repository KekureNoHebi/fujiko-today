'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './login-form';

interface LoginFormWrapperProps {
  locale: string;
  redirectUrl?: string;
}

export function LoginFormWrapper({
  locale,
  redirectUrl,
}: LoginFormWrapperProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check authentication status on the client side
    // This helps handle iOS Safari cookie timing issues
    const checkClientAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (data.authenticated) {
          // User is authenticated, redirect
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.push(`/${locale}`);
          }
        } else {
          // Not authenticated, show login form
          setChecking(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, show login form
        setChecking(false);
      }
    };

    checkClientAuth();
  }, [locale, redirectUrl, router]);

  if (checking) {
    // Show loading state while checking
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  return <LoginForm redirectUrl={redirectUrl} />;
}
