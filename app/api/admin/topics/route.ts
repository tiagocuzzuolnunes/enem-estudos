import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/lib/models/Topic'

export async function POST(req: NextRequest) {
  const { subareaId, subjectId, areaId, name } = await req.json()
  if (!subareaId || !subjectId || !areaId || !name?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await connectDB()
  const count = await Topic.countDocuments({ subareaId })
  const doc = await Topic.create({ subareaId, subjectId, areaId, name: name.trim(), order: count })
  return NextResponse.json({ _id: doc._id.toString(), name: doc.name, order: doc.order, subtopics: [] })
}
