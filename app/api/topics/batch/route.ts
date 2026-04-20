import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subtopic } from '@/lib/models/Subtopic'
import { Topic } from '@/lib/models/Topic'
import { Subarea } from '@/lib/models/Subarea'
import type { ISubtopic, ITopic, ISubarea } from '@/types'

// Returns a map of subjectId → sorted TopicEntry[] for multiple subjects in one query.
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('subjectIds')?.split(',').filter(Boolean) ?? []
  if (!ids.length) return NextResponse.json({})

  await connectDB()
  const [subtopics, topics, subareas] = await Promise.all([
    Subtopic.find({ subjectId: { $in: ids } }).lean() as unknown as ISubtopic[],
    Topic.find({    subjectId: { $in: ids } }).lean() as unknown as ITopic[],
    Subarea.find({  subjectId: { $in: ids } }).lean() as unknown as ISubarea[],
  ])

  const subareaOrder = new Map(subareas.map(s => [s._id.toString(), s.order]))
  const topicOrder   = new Map(topics.map(t => [t._id.toString(), t.order]))
  const topicName    = new Map(topics.map(t => [t._id.toString(), t.name]))
  const topicSubarea = new Map(topics.map(t => [t._id.toString(), t.subareaId.toString()]))

  const result: Record<string, object[]> = {}
  for (const id of ids) result[id] = []

  for (const st of subtopics) {
    const sid  = st.subjectId.toString()
    const tid  = st.topicId.toString()
    const said = topicSubarea.get(tid) ?? ''
    result[sid].push({
      _id:             st._id.toString(),
      name:            st.name,
      order:           st.order,
      topicId:         tid,
      topicName:       topicName.get(tid)    ?? '',
      topicOrder:      topicOrder.get(tid)   ?? 0,
      subareaId:       said,
      subareaOrder:    subareaOrder.get(said) ?? 0,
      completed:       st.completed          ?? false,
      videoLinks:      st.videoLinks         ?? [],
      exerciseLinks:   st.exerciseLinks      ?? [],
      additionalLinks: st.additionalLinks    ?? [],
    })
  }

  for (const id of ids) {
    result[id].sort((a: any, b: any) =>
      a.subareaOrder - b.subareaOrder ||
      a.topicOrder   - b.topicOrder   ||
      a.order        - b.order
    )
  }

  return NextResponse.json(result)
}
