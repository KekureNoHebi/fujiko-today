import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Sans_JP,
} from 'next/font/google';
import '@/app/globals.css';
import { GTProvider } from 'gt-next';
import { getGT } from 'gt-next/server';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import LocaleSelector from '@/components/layout/locale-selector';
import { ScrollToTop } from '@/components/navigation/scroll-to-top';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const notoSansTC = Noto_Sans_TC({
  variable: '--font-noto-sans-tc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const t = await getGT();
  const { locale } = await params;
  const siteTitle = t('Fujiko Today');
  const siteDescription = t(
    'Get the latest news about Fujiko・F・Fujio, the legendary manga artist behind Doraemon, and his works.',
  );

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const { fetchDirectusTerms } = await import('@/lib/services/directus-terms');
  const terms = await fetchDirectusTerms(locale);
  const keywords = [
    ...(terms.work?.map((t) => t.name) || []),
    ...(terms.person?.map((t) => t.name) || []),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    metadataBase: new URL(appUrl),
    title: {
      template: `%s | ${siteTitle}`,
      default: siteTitle,
    },
    description: siteDescription,
    keywords,
    appleWebApp: {
      title: siteTitle,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<LayoutProps>) {
  const { locale } = await params;
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable} ${notoSansTC.variable} ${notoSansJP.variable} antialiased`}
    >
      <body>
        <GTProvider>
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <Link href="/" className="text-xl font-semibold">
                    Fujiko Today
                  </Link>
                </div>
                <LocaleSelector />
              </header>
              <main className="flex-1 py-4 sm:py-6 md:py-8 px-4 sm:px-6">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </GTProvider>
        <Toaster />
        <ScrollToTop />
      </body>
    </html>
  );
}
