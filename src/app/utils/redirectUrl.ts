/**
 * Returns the appropriate redirect URL based on environment
 * In production, uses the NEXT_PUBLIC_SITE_URL environment variable
 * In development, uses localhost:3000
 */
export function getRedirectUrl(path: string = '/auth/callback'): string {
  // Get base URL and remove trailing slash if present
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // Ensure path starts with a /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  console.log('redirectUrl :>> ', `${baseUrl}${normalizedPath}`);

  return `${baseUrl}${normalizedPath}`;
}
