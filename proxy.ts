import { createNextMiddleware } from 'gt-next/middleware';

export default createNextMiddleware({
  prefixDefaultLocale: true,
});

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next).*)'],
};
