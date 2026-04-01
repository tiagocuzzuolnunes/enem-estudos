'use client'

import { useState } from 'react'
import SubtopicItem from '@/components/SubtopicItem'
import ProgressBar from '@/components/ProgressBar'
import type { AreaDetailUI, Priority } from '@/types'

type Filter = 'all' | 'pending' | 'completed'
type PriorityFilter = 'all' | Priority

interface Props {
  area: AreaDetailUI
}

export default function AreaContent({ area }: Props) {
  const [statusFilter, setStatusFilter]     = useState<Filter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [openSubtopicId, setOpenSubtopicId] = useState<string | null>(null)
  const [openSubjects, setOpenSubjects]     = useState<Set<string>>(new Set(area.subjects.map(s => s._id)))
  const [openSubareas, setOpenSubareas]     = useState<Set<string>>(new Set(area.subjects.flatMap(s => s.subareas.map(sa => sa._id))))
  const [openTopics, setOpenTopics]         = useState<Set<string>>(new Set(area.subjects.flatMap(s => s.subareas.flatMap(sa => sa.topics.map(t => t._id)))))

  function toggleSet(set: Set<string>, id: string): Set<string> {
    const next = new Set(set)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }

  const pct = area.totalSubtopics > 0
    ? Math.round((area.completedSubtopics / area.totalSubtopics) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Area progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-500">Progresso em {area.name}</p>
          <span className="font-bold text-lg" style={{ color: area.color }}>{pct}%</span>
        </div>
        <ProgressBar value={pct} color={area.color} height="h-3" />
        <p className="text-xs text-gray-400 mt-1.5">
          {area.completedSubtopics} de {area.totalSubtopics} subtópicos concluídos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'completed'] as Filter[]).map((f) => (
          <button key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              statusFilter === f
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            style={statusFilter === f ? { backgroundColor: area.color, borderColor: area.color } : {}}
          >
            {{ all: 'Todos', pending: 'Pendentes', completed: 'Concluídos' }[f]}
          </button>
        ))}
        <span className="border-l border-gray-200 mx-1" />
        {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((p) => (
          <button key={p}
            onClick={() => setPriorityFilter(p)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              priorityFilter === p
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {{ all: 'Todas prioridades', high: 'Alta', medium: 'Média', low: 'Baixa' }[p]}
          </button>
        ))}
      </div>

      {/* Hierarchy */}
      <div className="space-y-3">
        {area.subjects.map((subject) => {
          const isSubjectOpen = openSubjects.has(subject._id)
          const allSubtopics = subject.subareas.flatMap(sa => sa.topics.flatMap(t => t.subtopics))
          const subjectCompleted = allSubtopics.filter(st => st.completed).length
          const subjectTotal = allSubtopics.length
          const subjectPct = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0

          return (
            <div key={subject._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Subject header */}
              <button
                onClick={() => setOpenSubjects(toggleSet(openSubjects, subject._id))}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-400 text-sm">{isSubjectOpen ? '▼' : '▶'}</span>
                  <span className="font-semibold text-gray-900 text-sm">{subject.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <div className="hidden sm:block w-20">
                    <ProgressBar value={subjectPct} color={area.color} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{subjectPct}%</span>
                </div>
              </button>

              {isSubjectOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {subject.subareas.map((subarea) => {
                    const isSubareaOpen = openSubareas.has(subarea._id)
                    const saSubtopics = subarea.topics.flatMap(t => t.subtopics)
                    const saCompleted = saSubtopics.filter(st => st.completed).length

                    return (
                      <div key={subarea._id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenSubareas(toggleSet(openSubareas, subarea._id))}
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400 text-xs">{isSubareaOpen ? '▼' : '▶'}</span>
                            <span className="font-medium text-gray-700 text-sm">{subarea.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {saCompleted}/{saSubtopics.length}
                          </span>
                        </button>

                        {isSubareaOpen && (
                          <div className="p-3 space-y-2">
                            {subarea.topics.map((topic) => {
                              const isTopicOpen = openTopics.has(topic._id)
                              const filtered = topic.subtopics.filter((st) => {
                                const statusOk =
                                  statusFilter === 'all' ||
                                  (statusFilter === 'completed' && st.completed) ||
                                  (statusFilter === 'pending' && !st.completed)
                                const priorityOk = priorityFilter === 'all' || st.priority === priorityFilter
                                return statusOk && priorityOk
                              })

                              if (filtered.length === 0 && (statusFilter !== 'all' || priorityFilter !== 'all')) return null

                              const topicCompleted = topic.subtopics.filter(st => st.completed).length

                              return (
                                <div key={topic._id} className="border border-gray-100 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => setOpenTopics(toggleSet(openTopics, topic._id))}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-gray-300 text-xs">{isTopicOpen ? '▼' : '▶'}</span>
                                      <span className="text-sm text-gray-600">{topic.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                      {topicCompleted}/{topic.subtopics.length}
                                    </span>
                                  </button>

                                  {isTopicOpen && (
                                    <div className="px-3 pb-3 pt-1 space-y-2">
                                      {filtered.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-1">Nenhum subtópico para este filtro.</p>
                                      ) : (
                                        filtered.map((st) => (
                                          <SubtopicItem
                                            key={st._id}
                                            subtopic={st}
                                            areaColor={area.color}
                                            linksOpen={openSubtopicId === st._id}
                                            onToggleLinks={() => setOpenSubtopicId(prev => prev === st._id ? null : st._id)}
                                          />
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
