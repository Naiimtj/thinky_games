import { getAvatarColor, getAvatarInitials } from '../utils/avatar';

const UserAvatar = ({ username = '', avatarUrl = null, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizes[size] ?? sizes.md} rounded-full object-cover border border-slate-200 dark:border-slate-700`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size] ?? sizes.md} rounded-full flex items-center justify-center font-black text-white`}
      style={{ backgroundColor: getAvatarColor(username) }}
      aria-label={username}
      title={username}
    >
      {getAvatarInitials(username)}
    </div>
  );
};

export default UserAvatar;
