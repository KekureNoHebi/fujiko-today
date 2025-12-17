import { checkAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    redirect?: string;
  }>;
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { redirect: redirectUrl } = await searchParams;
  const isAuthenticated = await checkAuth();

  // If already authenticated, redirect to the target page or home
  if (isAuthenticated) {
    redirect(redirectUrl || `/${locale}`);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
