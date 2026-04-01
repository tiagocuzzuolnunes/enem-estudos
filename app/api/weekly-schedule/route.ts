import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { WeeklySchedule } from '@/lib/models/WeeklySchedule'

export async function GET() {
  await connectDB()
  const entries = await WeeklySchedule.find().sort({ dayOfWeek: 1 }).lean()
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  await connectDB()
  const { dayOfWeek, subjectId, subjectName, areaSlug, areaName, areaColor } = await req.json()

  const existing = await WeeklySchedule.findOne({ dayOfWeek, subjectId })
  if (existing) return NextResponse.json(existing)

  // startDate = next occurrence of dayOfWeek from today (inclusive)
  const today = new Date()
  let diff = dayOfWeek - today.getDay()
  if (diff < 0) diff += 7
  const start = new Date(today)
  start.setDate(today.getDate() + diff)
  const startDate = start.toLocaleDateString('sv-SE')

  const entry = await WeeklySchedule.create({ dayOfWeek, subjectId, subjectName, areaSlug, areaName, areaColor, startDate })
  return NextResponse.json(entry, { status: 201 })
}
