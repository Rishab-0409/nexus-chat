export default function Avatar({ user, size = 'md', showOnline = false }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  const dotSizes = { xs: 'w-2 h-2', sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' }

  const initials = (user?.username || '?').slice(0, 2).toUpperCase()
  const color    = user?.avatar_color || '#3d5eff'

  return (
    <div className={`relative flex-shrink-0 ${sizes[size]}`}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.username} className={`${sizes[size]} rounded-full object-cover`} />
        : (
          <div
            className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white`}
            style={{ background: color }}
          >
            {initials}
          </div>
        )
      }
      {showOnline && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full bg-green-400 border-2 border-gray-900`} />
      )}
    </div>
  )
}
