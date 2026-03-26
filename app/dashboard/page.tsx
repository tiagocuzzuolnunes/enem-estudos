import DashboardCard from '@/components/DashboardCard'
import DaysRemaining from '@/components/DaysRemaining'
import type { AreaCardUI, ISettings } from '@/types'

async function getAreas(): Promise<AreaCardUI[]> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/areas`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function getSettings(): Promise<ISettings | null> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/settings`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const [areas, settings] = await Promise.all([getAreas(), getSettings()])

  const totalSubtopics     = areas.reduce((s, a) => s + a.totalSubtopics, 0)
  const completedSubtopics = areas.reduce((s, a) => s + a.completedSubtopics, 0)
  const overallPct = totalSubtopics > 0
    ? Math.round((completedSubtopics / totalSubtopics) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe seu progresso geral</p>
      </div>

      {/* Days remaining + overall progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settings && <DaysRemaining enemDate={new Date(settings.enemDate).toISOString()} />}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 mb-1">Progresso Geral</p>
          <p className="text-4xl font-bold text-gray-900 mb-3">{overallPct}<span className="text-xl font-medium text-gray-400">%</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{completedSubtopics} de {totalSubtopics} subtópicos concluídos</p>
        </div>
      </div>

      {/* Area cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Por Área</h2>
        {areas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Nenhum conteúdo encontrado.</p>
            <p className="text-gray-400 text-xs mt-1">Execute <code className="bg-gray-100 px-1 rounded">npm run seed</code> para popular o banco de dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <DashboardCard key={area._id} area={area} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
