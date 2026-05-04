import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subject } from '@/lib/models/Subject'
import { Subarea } from '@/lib/models/Subarea'
import { Topic } from '@/lib/models/Topic'
import { Subtopic } from '@/lib/models/Subtopic'

export async function GET() {
  await connectDB()

  const [areas, subjects, subareas, topics, subtopics] = await Promise.all([
    Area.find().sort({ order: 1 }).lean(),
    Subject.find().sort({ order: 1 }).lean(),
    Subarea.find().sort({ order: 1 }).lean(),
    Topic.find().sort({ order: 1 }).lean(),
    Subtopic.find().sort({ order: 1 }).lean(),
  ])

  const subtopicsByTopic = new Map<string, typeof subtopics>()
  for (const st of subtopics) {
    const key = st.topicId.toString()
    if (!subtopicsByTopic.has(key)) subtopicsByTopic.set(key, [])
    subtopicsByTopic.get(key)!.push(st)
  }

  const topicsBySubarea = new Map<string, typeof topics>()
  for (const t of topics) {
    const key = t.subareaId.toString()
    if (!topicsBySubarea.has(key)) topicsBySubarea.set(key, [])
    topicsBySubarea.get(key)!.push(t)
  }

  const subareasBySubject = new Map<string, typeof subareas>()
  for (const sa of subareas) {
    const key = sa.subjectId.toString()
    if (!subareasBySubject.has(key)) subareasBySubject.set(key, [])
    subareasBySubject.get(key)!.push(sa)
  }

  const subjectsByArea = new Map<string, typeof subjects>()
  for (const s of subjects) {
    const key = s.areaId.toString()
    if (!subjectsByArea.has(key)) subjectsByArea.set(key, [])
    subjectsByArea.get(key)!.push(s)
  }

  const output = {
    exportedAt: new Date().toISOString(),
    areas: areas.map(area => ({
      name:  area.name,
      slug:  area.slug,
      color: area.color,
      icon:  area.icon,
      subjects: (subjectsByArea.get(area._id.toString()) ?? []).map(subj => ({
        name: subj.name,
        subareas: (subareasBySubject.get(subj._id.toString()) ?? []).map(sa => ({
          name: sa.name,
          topics: (topicsBySubarea.get(sa._id.toString()) ?? []).map(t => ({
            name: t.name,
            subtopics: (subtopicsByTopic.get(t._id.toString()) ?? []).map(st => ({
              name:      st.name,
              completed: st.completed ?? false,
            })),
          })),
        })),
      })),
    })),
  }

  return NextResponse.json(output, {
    headers: {
      'Content-Disposition': `attachment; filename="plano-estudos-${new Date().toLocaleDateString('sv-SE')}.json"`,
    },
  })
}
