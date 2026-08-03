import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import BaseButton from '../components/base/BaseButton';
import BaseDropFile from '../components/base/BaseDropFile/BaseDropFile';
import BaseTextInput from '../components/base/BaseTextInput';
import BaseToggleSwitch from '../components/base/BaseToggleSwitch';
import { CloseIcon } from '../components/base/icons';
import UserAvatar from '../components/UserAvatar';
import {
  deleteMyAccount,
  fetchUserProfile,
  removeFriendShare,
  searchUsers,
  uploadMyAvatar,
  updateFriendShare,
  updateMyAccount,
  updateMyPrivacy,
  upsertFriendShare,
} from '../api/userApi';
import { useAuthStore } from '../store/useAuthStore';

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const [busy, setBusy] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [friends, setFriends] = useState([]);
  const [globalShare, setGlobalShare] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [avatarFiles, setAvatarFiles] = useState([]);

  const friendIds = useMemo(
    () => new Set(friends.map((friend) => friend.friend_id)),
    [friends],
  );

  const handleAuthError = (apiError) => {
    if (apiError?.status === 401) {
      logout();
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const load = async () => {
      setBusy(true);
      setError('');
      try {
        const data = await fetchUserProfile();
        setProfile(data);
        setForm({ username: data.username, email: data.email, password: '' });
        setGlobalShare(data.share_results_globally);
        setFriends(data.friends ?? []);
      } catch (loadError) {
        if (!handleAuthError(loadError)) {
          setError(loadError.message || t('profile.errors.load'));
        }
      } finally {
        setBusy(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [error]);

  const submitAccount = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingAccount(true);
    try {
      const updated = await updateMyAccount(form);
      setUser(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage(t('profile.messages.accountSaved'));
    } catch (updateError) {
      if (!handleAuthError(updateError)) {
        setError(updateError.message || t('profile.errors.update'));
      }
    } finally {
      setSavingAccount(false);
    }
  };

  const toggleGlobalShare = async () => {
    const nextValue = !globalShare;
    setGlobalShare(nextValue);
    setSavingPrivacy(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateMyPrivacy(nextValue);
      setUser(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setMessage(t('profile.messages.privacySaved'));
    } catch (privacyError) {
      setGlobalShare(!nextValue);
      if (!handleAuthError(privacyError)) {
        setError(privacyError.message || t('profile.errors.privacy'));
      }
    } finally {
      setSavingPrivacy(false);
    }
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const users = await searchUsers(searchTerm.trim());
      setSearchResults(users);
    } catch (searchError) {
      if (!handleAuthError(searchError)) {
        setError(searchError.message || t('profile.errors.search'));
      }
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const addFriend = async (friendId) => {
    setError('');
    setMessage('');
    try {
      const relation = await upsertFriendShare({ friendId, shareTimes: true });
      setFriends((prev) => {
        const without = prev.filter(
          (entry) => entry.friend_id !== relation.friend_id,
        );
        return [...without, relation].sort((a, b) =>
          a.friend_username.localeCompare(b.friend_username),
        );
      });
      clearSearch();
      setMessage(t('profile.messages.friendSaved'));
    } catch (saveError) {
      if (!handleAuthError(saveError)) {
        setError(saveError.message || t('profile.errors.friendSave'));
      }
    }
  };

  const changeFriendShare = async (friendId, currentValue) => {
    setError('');
    const nextValue = !currentValue;
    setFriends((prev) =>
      prev.map((entry) =>
        entry.friend_id === friendId
          ? { ...entry, share_times: nextValue }
          : entry,
      ),
    );
    try {
      await updateFriendShare({ friendId, shareTimes: nextValue });
      setMessage(t('profile.messages.friendSaved'));
    } catch (saveError) {
      setFriends((prev) =>
        prev.map((entry) =>
          entry.friend_id === friendId
            ? { ...entry, share_times: currentValue }
            : entry,
        ),
      );
      if (!handleAuthError(saveError)) {
        setError(saveError.message || t('profile.errors.friendSave'));
      }
    }
  };

  const removeFriend = async (friendId) => {
    setError('');
    setMessage('');
    const previousFriends = friends;
    setFriends((prev) => prev.filter((entry) => entry.friend_id !== friendId));
    try {
      await removeFriendShare(friendId);
      setMessage(t('profile.messages.friendRemoved'));
    } catch (removeError) {
      setFriends(previousFriends);
      if (!handleAuthError(removeError)) {
        setError(removeError.message || t('profile.errors.friendDelete'));
      }
    }
  };

  const handleDeleteAccount = async () => {
    const accepted = window.confirm(t('profile.delete.confirm'));
    if (!accepted) return;

    setError('');
    setMessage('');
    try {
      await deleteMyAccount();
      logout();
      navigate('/', { replace: true });
    } catch (deleteError) {
      if (!handleAuthError(deleteError)) {
        setError(deleteError.message || t('profile.errors.delete'));
      }
    }
  };

  const uploadAvatar = async () => {
    if (avatarFiles.length === 0) {
      setError(t('profile.errors.avatarMissing'));
      return;
    }
    setSavingAvatar(true);
    setError('');
    setMessage('');
    try {
      const updated = await uploadMyAvatar(avatarFiles[0]);
      setUser(updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setAvatarFiles([]);
      setMessage(t('profile.messages.avatarSaved'));
    } catch (uploadError) {
      if (!handleAuthError(uploadError)) {
        if (!uploadError.status || uploadError.status >= 500) {
          setError(t('profile.errors.avatarUploadServer'));
        } else {
          setError(uploadError.message || t('profile.errors.avatarUpload'));
        }
      }
    } finally {
      setSavingAvatar(false);
    }
  };

  if (busy) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <p className="text-slate-700 dark:text-slate-200">
          {t('profile.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
        {t('profile.title')}
      </h1>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('profile.avatar.title')}
        </h2>

        <div className="flex items-center justify-center">
          <UserAvatar
            username={profile?.username}
            avatarUrl={profile?.avatar_url}
            size="lg"
          />
        </div>

        <BaseDropFile
          label={t('profile.avatar.uploadTitle')}
          limitNumberFiles={1}
          limitSizeFile="5"
          formats={['png', 'jpg', 'jpeg', 'webp']}
          buttonLabel={t('profile.avatar.browse')}
          files={avatarFiles}
          labelDragAndDrop={t('profile.avatar.dragAndDrop')}
          labelFormat={t('profile.avatar.accepted')}
          labelLimit={t('profile.avatar.limit')}
          labelMaxFile={t('profile.avatar.maxFiles')}
          labelReachedMaxFiles={t('profile.avatar.maxReached')}
          labelInvalidFormatMessage0={t('profile.avatar.invalidTitle')}
          labelInvalidFormatMessage1={t('profile.avatar.invalidLine1')}
          labelInvalidFormatMessage2={t('profile.avatar.invalidLine2')}
          onAddFiles={(files) => setAvatarFiles(files.slice(0, 1))}
          onDeleteFile={() => setAvatarFiles([])}
        />

        <BaseButton
          type="button"
          onClick={uploadAvatar}
          disabled={savingAvatar || avatarFiles.length === 0}
        >
          {savingAvatar ? t('profile.saving') : t('profile.avatar.save')}
        </BaseButton>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('profile.account.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('profile.account.description')}
        </p>

        <form className="space-y-4" onSubmit={submitAccount}>
          <BaseTextInput
            label={t('profile.account.username')}
            value={form.username}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, username: value }))
            }
          />
          <BaseTextInput
            label={t('profile.account.email')}
            type="email"
            value={form.email}
            onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
          />
          <BaseTextInput
            label={t('profile.account.password')}
            type="password"
            value={form.password}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, password: value }))
            }
            placeholder={t('profile.account.passwordPlaceholder')}
          />

          <BaseButton type="submit" disabled={savingAccount}>
            {savingAccount ? t('profile.saving') : t('profile.account.save')}
          </BaseButton>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('profile.privacy.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('profile.privacy.description')}
        </p>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('profile.privacy.shareGlobally')}
          </span>
          <BaseToggleSwitch
            value={globalShare}
            onChange={toggleGlobalShare}
            disabled={savingPrivacy}
            trueValue={true}
            falseValue={false}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('profile.friends.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('profile.friends.description')}
        </p>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={submitSearch}
        >
          <BaseTextInput
            label={t('profile.friends.searchLabel')}
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('profile.friends.searchPlaceholder')}
            appendIconComponent={
              searchTerm ? (
                <CloseIcon
                  size="small"
                  color="currentColor"
                  className="text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                />
              ) : null
            }
            appendIconAriaLabel={t('profile.friends.clearSearch')}
            onAppendIconClick={clearSearch}
          />
          <BaseButton
            type="submit"
            disabled={searching}
            className="sm:self-end"
          >
            {searching
              ? t('profile.searching')
              : t('profile.friends.searchButton')}
          </BaseButton>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {candidate.username} ({candidate.email})
                </span>
                <BaseButton
                  type="button"
                  onClick={() => addFriend(candidate.id)}
                  disabled={friendIds.has(candidate.id)}
                  variant="secondary"
                >
                  {friendIds.has(candidate.id)
                    ? t('profile.friends.added')
                    : t('profile.friends.add')}
                </BaseButton>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {friends.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('profile.friends.empty')}
            </p>
          )}

          {friends.map((friend) => (
            <div
              key={friend.friend_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {friend.friend_username}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('profile.friends.shareWithFriend')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <BaseToggleSwitch
                  value={friend.share_times}
                  onChange={() =>
                    changeFriendShare(friend.friend_id, friend.share_times)
                  }
                  trueValue={true}
                  falseValue={false}
                />
                <BaseButton
                  type="button"
                  variant="danger"
                  outlined
                  onClick={() => removeFriend(friend.friend_id)}
                >
                  {t('profile.friends.remove')}
                </BaseButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
        <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
          {t('profile.delete.title')}
        </h2>
        <p className="text-sm text-red-700 dark:text-red-300">
          {t('profile.delete.description')}
        </p>
        <BaseButton
          type="button"
          variant="danger"
          onClick={handleDeleteAccount}
        >
          {t('profile.delete.action')}
        </BaseButton>
      </section>

      {profile && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('profile.memberSince', {
            date: new Date(profile.created_at).toLocaleDateString(),
          })}
        </p>
      )}
    </div>
  );
};

export default ProfilePage;
