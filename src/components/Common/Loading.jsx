export default function Loading({ label = 'Loading…', fullScreen = false }) {
  const wrapperClass = fullScreen
    ? 'flex h-full min-h-[60vh] w-full items-center justify-center'
    : 'flex w-full items-center justify-center py-8'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
