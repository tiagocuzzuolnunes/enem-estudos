import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { WeeklySchedule } from '@/lib/models/WeeklySchedule'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const { perDay } = await req.json()
  const entry = await WeeklySchedule.findByIdAndUpdate(id, { perDay }, { new: true })
  return NextResponse.json(entry)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  await WeeklySchedule.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
