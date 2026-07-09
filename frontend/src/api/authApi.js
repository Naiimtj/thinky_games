/** HTTP calls for authentication. */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const readDetail = async (response) => {
  try {
    const data = await response.json();
    return typeof data.detail === 'string' ? data.detail : null;
  } catch {
    return null;
  }
};

/** Create a new account. Returns the public user. */
export const registerUser = async ({ username, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok) {
    throw new Error(
      (await readDetail(response)) ?? 'No se pudo crear la cuenta',
    );
  }
  return response.json();
};

/** Exchange credentials for a bearer token (OAuth2 password form). */
export const loginUser = async ({ username, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) {
    throw new Error('Usuario o contraseña incorrectos');
  }
  return response.json();
};

/** Fetch the profile of the user owning the given token. */
export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('La sesión no es válida');
  }
  return response.json();
};
