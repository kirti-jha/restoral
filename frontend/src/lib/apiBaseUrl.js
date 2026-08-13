const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const PROD_API_BASE_URL = '/api';

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return import.meta.env.PROD ? PROD_API_BASE_URL : LOCAL_API_BASE_URL;
}

export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}
