import DashboardCard from '@/components/DashboardCard'
import DaysRemaining from '@/components/DaysRemaining'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subtopic } from '@/lib/models/Subtopic'
import { Settings } from '@/lib/models/Settings'
import type { AreaCardUI, ISettings } from '@/types'

export default async function DashboardPage() {
  await connectDB()

  const [areas, stats, settings] = await Promise.all([
    Area.find().sort({ name: 1 }).lean() as unknown as { _id: { toString(): string }; name: string; slug: string; color: string; icon: string }[],
    Subtopic.aggregate([
      { $group: { _id: '$areaId', total: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } },
    ]),
    Settings.findOne().lean() as unknown as ISettings | null,
  ])

  const statsMap = new Map(stats.map((s: { _id: { toString(): string }; total: number; completed: number }) => [s._id.toString(), s]))

  const areaCards: AreaCardUI[] = areas.map((a) => {
    const s = statsMap.get(a._id.toString())
    return {
      _id:                a._id.toString(),
      name:               a.name,
      slug:               a.slug,
      color:              a.color,
      icon:               a.icon,
      totalSubtopics:     s?.total     ?? 0,
      completedSubtopics: s?.completed ?? 0,
    }
  })

  const totalSubtopics     = areaCards.reduce((sum, a) => sum + a.totalSubtopics, 0)
  const completedSubtopics = areaCards.reduce((sum, a) => sum + a.completedSubtopics, 0)
  const overallPct = totalSubtopics > 0
    ? Math.round((completedSubtopics / totalSubtopics) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe seu progresso geral</p>
      </div>

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

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Por Área</h2>
        {areaCards.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Nenhum conteúdo encontrado.</p>
            <p className="text-gray-400 text-xs mt-1">Execute <code className="bg-gray-100 px-1 rounded">npm run seed</code> para popular o banco de dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaCards.map((area) => (
              <DashboardCard key={area._id} area={area} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
