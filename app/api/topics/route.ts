import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Subtopic } from '@/lib/models/Subtopic'
import { Topic } from '@/lib/models/Topic'
import { Subarea } from '@/lib/models/Subarea'
import type { ISubtopic, ITopic, ISubarea } from '@/types'

// Returns a flat ordered list of subtopics for a subject,
// each annotated with its parent topic name.
export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get('subjectId')
  if (!subjectId) return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 })

  await connectDB()
  const [subtopics, topics, subareas] = await Promise.all([
    Subtopic.find({ subjectId }).lean() as unknown as ISubtopic[],
    Topic.find({ subjectId }).lean()    as unknown as ITopic[],
    Subarea.find({ subjectId }).lean()  as unknown as ISubarea[],
  ])

  const subareaOrder = new Map(subareas.map(s => [s._id.toString(), s.order]))
  const topicOrder   = new Map(topics.map(t => [t._id.toString(), t.order]))
  const topicName    = new Map(topics.map(t => [t._id.toString(), t.name]))
  const topicSubarea = new Map(topics.map(t => [t._id.toString(), t.subareaId.toString()]))

  return NextResponse.json(
    subtopics
      .map(st => {
        const tid  = st.topicId.toString()
        const said = topicSubarea.get(tid) ?? ''
        return {
          _id:             st._id.toString(),
          name:            st.name,
          order:           st.order,
          topicId:         tid,
          topicName:       topicName.get(tid) ?? '',
          topicOrder:      topicOrder.get(tid) ?? 0,
          subareaId:       said,
          subareaOrder:    subareaOrder.get(said) ?? 0,
          completed:       st.completed ?? false,
          videoLinks:      st.videoLinks      ?? [],
          exerciseLinks:   st.exerciseLinks   ?? [],
          additionalLinks: st.additionalLinks ?? [],
        }
      })
      .sort((a, b) =>
        a.subareaOrder - b.subareaOrder ||
        a.topicOrder   - b.topicOrder   ||
        a.order        - b.order
      )
  )
}
