import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Settings } from '@/lib/models/Settings'

export async function GET() {
  await connectDB()
  const settings = await Settings.findOne().lean()
  if (!settings) {
    // Default: ENEM 2025 - November 9
    const created = await Settings.create({ enemDate: new Date('2025-11-09') })
    return NextResponse.json(created)
  }
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  await connectDB()
  const { enemDate } = await req.json()
  const settings = await Settings.findOneAndUpdate(
    {},
    { enemDate: new Date(enemDate) },
    { upsert: true, new: true },
  ).lean()
  return NextResponse.json(settings)
}
