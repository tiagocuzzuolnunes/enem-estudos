import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subarea } from '@/lib/models/Subarea'

export async function POST(req: NextRequest) {
  const { subjectId, areaId, name } = await req.json()
  if (!subjectId || !areaId || !name?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await connectDB()
  const count = await Subarea.countDocuments({ subjectId })
  const doc = await Subarea.create({ subjectId, areaId, name: name.trim(), order: count })
  return NextResponse.json({ _id: doc._id.toString(), name: doc.name, order: doc.order, topics: [] })
}
