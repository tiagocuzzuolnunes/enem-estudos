export const dynamic = 'force-dynamic'

import DaysRemaining from '@/components/DaysRemaining'
import DashboardGrid from '@/components/DashboardGrid'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subject } from '@/lib/models/Subject'
import { Subtopic } from '@/lib/models/Subtopic'
import type { SubjectCardUI } from '@/types'

export default async function DashboardPage() {
  await connectDB()

  const [areas, subjects, [stats]] = await Promise.all([
    Area.find().sort({ order: 1 }).lean() as unknown as { _id: { toString(): string }; name: string; slug: string; color: string; icon: string; order: number }[],
    Subject.find().sort({ order: 1 }).lean() as unknown as { _id: { toString(): string }; areaId: { toString(): string }; name: string; order: number }[],
    Subtopic.aggregate<{ byArea: { _id: string; total: number; completed: number }[]; bySubject: { _id: string; total: number; completed: number }[] }>([
      { $facet: {
        byArea:    [{ $group: { _id: '$areaId',    total: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } }],
        bySubject: [{ $group: { _id: '$subjectId', total: { $sum: 1 }, completed: { $sum: { $cond: ['$completed', 1, 0] } } } }],
      } },
    ]),
  ])
  const areaStats    = stats.byArea
  const subjectStats = stats.bySubject

  const areaMap    = new Map(areas.map((a) => [a._id.toString(), a]))
  const subjStats_ = new Map(subjectStats.map(s => [s._id.toString(), s]))

  const subjectCards: SubjectCardUI[] = subjects
    .map((subj) => {
      const area = areaMap.get(subj.areaId.toString())
      const s    = subjStats_.get(subj._id.toString())
      return {
        _id:                subj._id.toString(),
        name:               subj.name,
        areaSlug:           area?.slug  ?? '',
        areaColor:          area?.color ?? '#6b7280',
        areaIcon:           area?.icon  ?? '',
        areaName:           area?.name  ?? '',
        areaOrder:          area?.order  ?? 99,
        subjectOrder:       subj.order,
        totalSubtopics:     s?.total     ?? 0,
        completedSubtopics: s?.completed ?? 0,
      }
    })
    .sort((a, b) => a.areaOrder - b.areaOrder || a.subjectOrder - b.subjectOrder)
    .map(({ areaOrder: _a, subjectOrder: _b, ...rest }) => rest) as SubjectCardUI[]

  const totalSubtopics     = areaStats.reduce((sum, a) => sum + a.total, 0)
  const completedSubtopics = areaStats.reduce((sum, a) => sum + a.completed, 0)
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
        <DaysRemaining />
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

      <DashboardGrid subjectCards={subjectCards} />
    </div>
  )
}
