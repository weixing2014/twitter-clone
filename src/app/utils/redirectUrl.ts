/**
 * Returns the appropriate redirect URL based on environment
 * In production, uses the NEXT_PUBLIC_SITE_URL environment variable
 * In development, uses localhost:3000
 */
export function getRedirectUrl(path: string = '/auth/callback'): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

  // Ensure path starts with a /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
