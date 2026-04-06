import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subtopic } from '@/lib/models/Subtopic'

export async function POST(req: NextRequest) {
  const { topicId, subareaId, subjectId, areaId, name, priority } = await req.json()
  if (!topicId || !subareaId || !subjectId || !areaId || !name?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await connectDB()
  const count = await Subtopic.countDocuments({ topicId })
  const doc = await Subtopic.create({
    topicId,
    subareaId,
    subjectId,
    areaId,
    name: name.trim(),
    order: count,
    priority: priority ?? 'medium',
  })
  return NextResponse.json({ _id: doc._id.toString(), name: doc.name, order: doc.order })
}
