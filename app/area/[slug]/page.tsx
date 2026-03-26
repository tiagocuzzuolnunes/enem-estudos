import { notFound } from 'next/navigation'
import Link from 'next/link'
import AreaContent from './AreaContent'
import type { AreaDetailUI } from '@/types'

async function getArea(slug: string): Promise<AreaDetailUI | null> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/areas/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

const iconMap: Record<string, string> = {
  flask: '🔬', globe: '🌍', book: '📖', calculator: '🧮', pencil: '✏️',
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const area = await getArea(slug)
  if (!area) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">
      {/* Back + header */}
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{iconMap[area.icon] ?? '📚'}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{area.name}</h1>
            <p className="text-sm text-gray-500">
              {area.subjects.length} disciplina{area.subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <AreaContent area={area} />
    </div>
  )
}
