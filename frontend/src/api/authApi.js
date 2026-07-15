/** HTTP calls for authentication. */

import { API_BASE_URL } from './apiConfig';
import i18n from '../i18n';

/** The hint contains no credential; it only avoids a blind session request. */
export const hasSessionHint = () =>
  typeof document !== 'undefined' &&
  document.cookie.split('; ').includes('thinky_session_hint=1');

/** Create a new account. Returns the public user. */
export const registerUser = async ({ username, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok) {
    throw new Error(i18n.t('auth.errors.register'));
  }
  return response.json();
};

/** Exchange credentials for a bearer token (OAuth2 password form). */
export const loginUser = async ({ username, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) {
    throw new Error(i18n.t('auth.errors.login'));
  }
  return response.json();
};

/** Fetch the profile associated with the HttpOnly session cookie. */
export const fetchCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(i18n.t('auth.errors.session'));
  }
  return response.json();
};

export const logoutUser = async () => {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
};
