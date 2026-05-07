export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#0A0F18] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-48 w-full rounded-lg bg-[#111926] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-[#111926] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
