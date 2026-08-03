/** HTTP calls for profile and sharing preferences. */

import i18n from '../i18n';
import { API_BASE_URL } from './apiConfig';

const authOptions = { credentials: 'include' };

const ensureOk = async (response, fallbackMessage) => {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === 'string') {
        message = payload.detail;
      }
    } catch {
      // Ignore JSON parse failures and keep fallback.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response;
};

export const fetchUserProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/users/me/profile`, authOptions);
  await ensureOk(response, i18n.t('profile.errors.load'));
  return response.json();
};

export const updateMyAccount = async ({ username, email, password }) => {
  const body = {};
  if (username !== undefined) body.username = username;
  if (email !== undefined) body.email = email;
  if (password !== undefined && password !== '') body.password = password;

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    ...authOptions,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await ensureOk(response, i18n.t('profile.errors.update'));
  return response.json();
};

export const updateMyPrivacy = async (shareResultsGlobally) => {
  const response = await fetch(`${API_BASE_URL}/users/me/privacy`, {
    method: 'PATCH',
    ...authOptions,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_results_globally: shareResultsGlobally }),
  });
  await ensureOk(response, i18n.t('profile.errors.privacy'));
  return response.json();
};

export const searchUsers = async (query) => {
  const response = await fetch(
    `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
    authOptions,
  );
  await ensureOk(response, i18n.t('profile.errors.search'));
  return response.json();
};

export const upsertFriendShare = async ({ friendId, shareTimes }) => {
  const response = await fetch(`${API_BASE_URL}/users/me/friends`, {
    method: 'POST',
    ...authOptions,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friend_id: friendId, share_times: shareTimes }),
  });
  await ensureOk(response, i18n.t('profile.errors.friendSave'));
  return response.json();
};

export const updateFriendShare = async ({ friendId, shareTimes }) => {
  const response = await fetch(`${API_BASE_URL}/users/me/friends/${friendId}`, {
    method: 'PATCH',
    ...authOptions,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_times: shareTimes }),
  });
  await ensureOk(response, i18n.t('profile.errors.friendSave'));
  return response.json();
};

export const removeFriendShare = async (friendId) => {
  const response = await fetch(`${API_BASE_URL}/users/me/friends/${friendId}`, {
    method: 'DELETE',
    ...authOptions,
  });
  await ensureOk(response, i18n.t('profile.errors.friendDelete'));
};

export const deleteMyAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    ...authOptions,
  });
  await ensureOk(response, i18n.t('profile.errors.delete'));
};

export const uploadMyAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: 'POST',
    ...authOptions,
    body: formData,
  });
  await ensureOk(response, i18n.t('profile.errors.avatarUpload'));
  return response.json();
};
