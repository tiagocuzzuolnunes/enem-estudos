export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import AreaContent from './AreaContent'
import { connectDB } from '@/lib/mongodb'
import { Area } from '@/lib/models/Area'
import { Subject } from '@/lib/models/Subject'
import { Subarea } from '@/lib/models/Subarea'
import { Topic } from '@/lib/models/Topic'
import { Subtopic } from '@/lib/models/Subtopic'
import type { IArea, ISubject, ISubarea, ITopic, ISubtopic, AreaDetailUI, SubjectUI, SubareaUI, TopicUI, SubtopicUI } from '@/types'

const iconMap: Record<string, string> = {
  flask: '🔬', globe: '🌍', book: '📖', calculator: '🧮', pencil: '✏️',
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  await connectDB()

  const area = await Area.findOne({ slug }).lean() as unknown as IArea | null
  if (!area) notFound()

  const areaId = area._id

  const [subjects, subareas, topics, subtopics] = await Promise.all([
    Subject.find({ areaId }).sort({ order: 1 }).lean() as unknown as ISubject[],
    Subarea.find({ areaId }).sort({ order: 1 }).lean() as unknown as ISubarea[],
    Topic.find({ areaId }).sort({ order: 1 }).lean() as unknown as ITopic[],
    Subtopic.find({ areaId }).sort({ order: 1 }).lean() as unknown as ISubtopic[],
  ])

  const subareasBySubject = new Map<string, ISubarea[]>()
  subareas.forEach((sa) => {
    const key = sa.subjectId.toString()
    if (!subareasBySubject.has(key)) subareasBySubject.set(key, [])
    subareasBySubject.get(key)!.push(sa)
  })

  const topicsBySubarea = new Map<string, ITopic[]>()
  topics.forEach((t) => {
    const key = t.subareaId.toString()
    if (!topicsBySubarea.has(key)) topicsBySubarea.set(key, [])
    topicsBySubarea.get(key)!.push(t)
  })

  const subtopicsByTopic = new Map<string, ISubtopic[]>()
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

  const areaData: AreaDetailUI = {
    _id:                area._id.toString(),
    name:               area.name,
    slug:               area.slug,
    color:              area.color,
    icon:               area.icon,
    subjects:           subjectsUI,
    totalSubtopics:     subtopics.length,
    completedSubtopics: subtopics.filter((s) => s.completed).length,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 space-y-5">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{iconMap[area.icon] ?? '📚'}</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{area.name}</h1>
            <p className="text-sm text-gray-500">
              {areaData.subjects.length} disciplina{areaData.subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <AreaContent area={areaData} />
    </div>
  )
}
