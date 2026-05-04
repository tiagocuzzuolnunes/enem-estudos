import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subtopic } from '@/lib/models/Subtopic'
import { WeeklySchedule } from '@/lib/models/WeeklySchedule'
import { StudyLog } from '@/lib/models/StudyLog'

export async function POST() {
  await connectDB()

  // 1. Reset all subtopics
  await Subtopic.updateMany({}, { $set: { completed: false, completedAt: null } })

  // 2. Clear all study logs
  await StudyLog.deleteMany({})

  // 3. Reset each schedule entry's startDate to the next occurrence of its dayOfWeek from today
  const entries = await WeeklySchedule.find().lean()
  const today = new Date()

  await Promise.all(entries.map(entry => {
    let diff = entry.dayOfWeek - today.getDay()
    if (diff < 0) diff += 7
    const start = new Date(today)
    start.setDate(today.getDate() + diff)
    const startDate = start.toLocaleDateString('sv-SE')
    return WeeklySchedule.updateOne({ _id: entry._id }, { $set: { startDate } })
  }))

  return NextResponse.json({ ok: true })
}
