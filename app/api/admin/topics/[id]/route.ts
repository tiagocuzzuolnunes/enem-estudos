import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Topic } from '@/lib/models/Topic'
import { Subtopic } from '@/lib/models/Subtopic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  await connectDB()
  if (body.swap) {
    const [a, b] = await Promise.all([Topic.findById(id), Topic.findById(body.swap)])
    if (!a || !b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const tmp = a.order; a.order = b.order; b.order = tmp
    await Promise.all([a.save(), b.save()])
    return NextResponse.json({ ok: true })
  }
  if (body.name !== undefined) {
    const doc = await Topic.findByIdAndUpdate(id, { name: body.name.trim() }, { new: true })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()
  await Promise.all([
    Subtopic.deleteMany({ topicId: id }),
    Topic.findByIdAndDelete(id),
  ])
  return NextResponse.json({ ok: true })
}
