import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subtopic } from '@/lib/models/Subtopic'
import type { IArea, AreaCardUI } from '@/types'

export async function GET() {
  await connectDB()

  const [areas, stats] = await Promise.all([
    Area.find().sort({ name: 1 }).lean() as unknown as IArea[],
    Subtopic.aggregate([
      {
        $group: {
          _id: '$areaId',
          total:     { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
        },
      },
    ]),
  ])

  const statsMap = new Map(stats.map((s) => [s._id.toString(), s]))

  const result: AreaCardUI[] = areas.map((a) => {
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

  return NextResponse.json(result)
}
