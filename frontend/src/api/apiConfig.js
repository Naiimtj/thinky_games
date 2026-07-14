const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/** Keep loopback aliases on one host so browser cookies are sent consistently. */
export const API_BASE_URL = (() => {
  if (typeof window === 'undefined') return configuredApiBaseUrl;

  try {
    const apiUrl = new URL(configuredApiBaseUrl, window.location.origin);
    const loopbackHosts = new Set(['localhost', '127.0.0.1']);

    if (
      loopbackHosts.has(apiUrl.hostname) &&
      loopbackHosts.has(window.location.hostname)
    ) {
      apiUrl.hostname = window.location.hostname;
    }

    return apiUrl.toString().replace(/\/$/, '');
  } catch {
    return configuredApiBaseUrl;
  }
})();
