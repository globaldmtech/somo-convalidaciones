function normalizedBasePath(): string {
  const baseUri = typeof document !== 'undefined' ? document.baseURI : '/';
  const path = new URL(baseUri, window.location.origin).pathname;
  return path.replace(/\/+$/, '');
}

const basePath = normalizedBasePath();
const withBase = (suffix: string): string => `${basePath}${suffix}` || suffix;

export const API_BASE = withBase('');
export const ADMIN_API_BASE = withBase('/admin');
export const AUTH_API_BASE = '/auth';
