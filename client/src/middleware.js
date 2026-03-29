export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/',
    '/history/:path*',
    // Add other protected routes here
  ],
};
