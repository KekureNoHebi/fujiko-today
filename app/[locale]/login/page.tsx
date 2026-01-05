import { checkAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginFormWrapper } from '@/components/auth/login-form-wrapper';
import type { Metadata } from 'next';
import { getGT } from 'gt-next/server';
import { generatePageMetadata } from '@/lib/utils/metadata';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    redirect?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getGT();
  const { locale } = await params;

  const metaTitle = t('Login');

  return generatePageMetadata({
    title: metaTitle,
    description: metaTitle,
    locale,
    path: '/login',
    type: 'website',
  });
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
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)] flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <LoginFormWrapper locale={locale} redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
