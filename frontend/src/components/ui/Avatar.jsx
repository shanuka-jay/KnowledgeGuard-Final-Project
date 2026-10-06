export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  }

  const initials = (user?.name || 'User')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const avatarSrc = user?.avatarUrl?.startsWith('/api')
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`
    : user?.avatarUrl

  return (
    <div className={`${sizes[size] || sizes.md} ${className} avatar-shell`}>
      {avatarSrc ? (
        <img src={avatarSrc} alt={`${user?.name || 'User'} profile`} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
