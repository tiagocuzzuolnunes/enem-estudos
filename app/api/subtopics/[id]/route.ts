import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subtopic } from '@/lib/models/Subtopic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connectDB()
  const { id } = await params
  const body = await req.json()

  const update: Record<string, unknown> = {}
  if (typeof body.completed === 'boolean') {
    update.completed   = body.completed
    update.completedAt = body.completed ? new Date() : null
  }
  if (['high', 'medium', 'low'].includes(body.priority)) {
    update.priority = body.priority
  }

  const doc = await Subtopic.findByIdAndUpdate(
    id,
    update,
    { new: true },
  ).lean()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc)
}
