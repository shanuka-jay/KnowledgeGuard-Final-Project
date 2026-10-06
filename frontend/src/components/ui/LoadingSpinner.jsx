export default function LoadingSpinner({ size = 'md', text = '' }) {
  const s = { sm:'h-4 w-4', md:'h-8 w-8', lg:'h-12 w-12' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`relative ${s}`}>
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
        <div className={`relative animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 dark:border-white/10 dark:border-t-blue-300 ${s}`} />
      </div>
      {text && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  )
}
