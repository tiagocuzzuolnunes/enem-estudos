import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subject } from '@/lib/models/Subject'
import { Subarea } from '@/lib/models/Subarea'
import { Topic } from '@/lib/models/Topic'
import { Subtopic } from '@/lib/models/Subtopic'
import type { AreaDetailUI, SubjectUI, SubareaUI, TopicUI, SubtopicUI } from '@/types'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  await connectDB()

  const area = await Area.findOne({ slug: params.slug }).lean()
  if (!area) return NextResponse.json({ error: 'Area not found' }, { status: 404 })

  const areaId = area._id

  const [subjects, subareas, topics, subtopics] = await Promise.all([
    Subject.find({ areaId }).sort({ order: 1 }).lean(),
    Subarea.find({ areaId }).sort({ order: 1 }).lean(),
    Topic.find({ areaId }).sort({ order: 1 }).lean(),
    Subtopic.find({ areaId }).sort({ order: 1 }).lean(),
  ])

  // Build maps
  const subareasBySubject = new Map<string, typeof subareas>()
  subareas.forEach((sa) => {
    const key = sa.subjectId.toString()
    if (!subareasBySubject.has(key)) subareasBySubject.set(key, [])
    subareasBySubject.get(key)!.push(sa)
  })

  const topicsBySubarea = new Map<string, typeof topics>()
  topics.forEach((t) => {
    const key = t.subareaId.toString()
    if (!topicsBySubarea.has(key)) topicsBySubarea.set(key, [])
    topicsBySubarea.get(key)!.push(t)
  })

  const subtopicsByTopic = new Map<string, typeof subtopics>()
  subtopics.forEach((st) => {
    const key = st.topicId.toString()
    if (!subtopicsByTopic.has(key)) subtopicsByTopic.set(key, [])
    subtopicsByTopic.get(key)!.push(st)
  })

  const subjectsUI: SubjectUI[] = subjects.map((subj) => ({
    _id: subj._id.toString(),
    name: subj.name,
    order: subj.order,
    subareas: (subareasBySubject.get(subj._id.toString()) ?? []).map((sa): SubareaUI => ({
      _id: sa._id.toString(),
      name: sa.name,
      order: sa.order,
      topics: (topicsBySubarea.get(sa._id.toString()) ?? []).map((t): TopicUI => ({
        _id: t._id.toString(),
        name: t.name,
        order: t.order,
        subtopics: (subtopicsByTopic.get(t._id.toString()) ?? []).map((st): SubtopicUI => ({
          _id: st._id.toString(),
          name: st.name,
          order: st.order,
          videoLinks: st.videoLinks as { title: string; url: string }[],
          exerciseLinks: st.exerciseLinks as { title: string; url: string }[],
          priority: st.priority as 'high' | 'medium' | 'low',
          completed: st.completed,
          completedAt: st.completedAt?.toISOString() ?? null,
        })),
      })),
    })),
  }))

  const total     = subtopics.length
  const completed = subtopics.filter((s) => s.completed).length

  const result: AreaDetailUI = {
    _id:                area._id.toString(),
    name:               area.name,
    slug:               area.slug,
    color:              area.color,
    icon:               area.icon,
    subjects:           subjectsUI,
    totalSubtopics:     total,
    completedSubtopics: completed,
  }

  return NextResponse.json(result)
}
