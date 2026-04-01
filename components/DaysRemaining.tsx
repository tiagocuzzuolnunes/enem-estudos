const ENEM_DAY1 = new Date('2026-11-08T00:00:00')
const ENEM_DAY2 = new Date('2026-11-15T00:00:00')

function daysUntil(target: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function DaysRemaining() {
  const day1 = daysUntil(ENEM_DAY1)
  const day2 = daysUntil(ENEM_DAY2)

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-3">ENEM 2026</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/15 rounded-xl py-3 text-center">
          <p className="text-4xl font-bold">{day1 > 0 ? day1 : '—'}</p>
          <p className="text-xs opacity-80 mt-1">dias — 1º Dia</p>
          <p className="text-xs opacity-60">8 nov</p>
        </div>
        <div className="bg-white/15 rounded-xl py-3 text-center">
          <p className="text-4xl font-bold">{day2 > 0 ? day2 : '—'}</p>
          <p className="text-xs opacity-80 mt-1">dias — 2º Dia</p>
          <p className="text-xs opacity-60">15 nov</p>
        </div>
      </div>
    </div>
  )
}
