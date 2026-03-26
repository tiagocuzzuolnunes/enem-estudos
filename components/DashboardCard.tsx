import Link from 'next/link'
import ProgressBar from './ProgressBar'
import type { AreaCardUI } from '@/types'

interface Props {
  area: AreaCardUI
}

const iconMap: Record<string, string> = {
  flask:      '🔬',
  globe:      '🌍',
  book:       '📖',
  calculator: '🧮',
  pencil:     '✏️',
}

export default function DashboardCard({ area }: Props) {
  const pct = area.totalSubtopics > 0
    ? Math.round((area.completedSubtopics / area.totalSubtopics) * 100)
    : 0

  return (
    <Link href={`/area/${area.slug}`}>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{iconMap[area.icon] ?? '📚'}</span>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{area.name}</h3>
        </div>
        <ProgressBar value={pct} color={area.color} height="h-2.5" />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{area.completedSubtopics}/{area.totalSubtopics} subtópicos</span>
          <span className="font-semibold" style={{ color: area.color }}>{pct}%</span>
        </div>
      </div>
    </Link>
  )
}
