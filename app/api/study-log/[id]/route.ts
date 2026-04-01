import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { StudyLog } from '@/lib/models/StudyLog'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  await StudyLog.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
