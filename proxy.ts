import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createNextMiddleware } from 'gt-next/middleware';

const AUTH_COOKIE_NAME = 'fujiko_auth';

const i18nMiddleware = createNextMiddleware({
  prefixDefaultLocale: true,
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check authentication for specific API routes
  if (pathname === '/api/models' || pathname === '/api/translate-multiple') {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 },
      );
    }
    // Auth passed, continue to next handler
    return NextResponse.next();
  }

  // Check authentication for /analyze pages
  if (pathname.includes('/analyze')) {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie || authCookie.value !== 'authenticated') {
      // Extract locale from pathname (e.g., /en/dora-world/contents/123/analyze)
      const localeMatch = pathname.match(/^\/([^\/]+)\//);
      const locale = localeMatch ? localeMatch[1] : 'en';

      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For non-API routes, use i18n middleware
  return i18nMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|static|.*\\..*|_next).*)', // i18n routes
    '/api/models', // authenticated API routes
    '/api/translate-multiple', // authenticated API routes
  ],
};
