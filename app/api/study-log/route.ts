import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { StudyLog } from '@/lib/models/StudyLog'

export async function GET(req: NextRequest) {
  await connectDB()
  const month = req.nextUrl.searchParams.get('month')
  const from  = req.nextUrl.searchParams.get('from')
  const to    = req.nextUrl.searchParams.get('to')
  const query = from && to
    ? { date: { $gte: from, $lte: to } }
    : month
      ? { date: { $gte: `${month}-01`, $lte: `${month}-31` } }
      : {}
  const logs = await StudyLog.find(query).sort({ date: 1, createdAt: 1 }).lean()
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const { date, subjectId, subjectName, areaSlug, areaName, areaColor } = body
  if (!date || !subjectId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  // Prevent duplicate entry for same day + subject
  const existing = await StudyLog.findOne({ date, subjectId })
  if (existing) {
    return NextResponse.json(existing)
  }
  const log = await StudyLog.create({ date, subjectId, subjectName, areaSlug, areaName, areaColor })
  return NextResponse.json(log, { status: 201 })
}
