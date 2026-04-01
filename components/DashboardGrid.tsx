'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProgressBar from './ProgressBar'
import StudyCalendar from './StudyCalendar'
import type { SubjectCardUI } from '@/types'

const iconMap: Record<string, string> = {
  flask: '🔬', globe: '🌍', book: '📖', calculator: '🧮', pencil: '✏️',
}

interface Props {
  subjectCards: SubjectCardUI[]
}

export default function DashboardGrid({ subjectCards }: Props) {
  const [view, setView] = useState<'subjects' | 'calendar'>('calendar')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">
          {view === 'subjects' ? 'Por Disciplina' : 'Calendário'}
        </h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
            onClick={() => setView('calendar')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendário
          </button>
          <button
            onClick={() => setView('subjects')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              view === 'subjects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Disciplinas
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <StudyCalendar subjectCards={subjectCards} />
      ) : (
        <div className="space-y-6">
          {(() => {
            const MERGED_SLUGS = new Set(['redacao', 'linguagens'])

            type Group = { label: string; color: string; subjects: SubjectCardUI[] }
            const groups: Group[] = []
            let mergedGroup: Group | null = null

            for (const subj of subjectCards) {
              if (MERGED_SLUGS.has(subj.areaSlug)) {
                if (!mergedGroup) {
                  mergedGroup = { label: 'Linguagens e Redação', color: '#3b82f6', subjects: [] }
                  groups.push(mergedGroup)
                }
                mergedGroup.subjects.push(subj)
              } else {
                const last = groups[groups.length - 1]
                if (last && last.label === subj.areaName) {
                  last.subjects.push(subj)
                } else {
                  groups.push({ label: subj.areaName, color: subj.areaColor, subjects: [subj] })
                }
              }
            }

            return groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: group.color }}>{group.label}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.subjects.map((subj) => {
                    const pct = subj.totalSubtopics > 0
                      ? Math.round((subj.completedSubtopics / subj.totalSubtopics) * 100)
                      : 0
                    return (
                      <Link key={subj._id} href={`/area/${subj.areaSlug}`}>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{iconMap[subj.areaIcon] ?? '📚'}</span>
                            <span className="text-xs text-gray-400">{subj.areaName}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-3">{subj.name}</h3>
                          <ProgressBar value={pct} color={subj.areaColor} height="h-2.5" />
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{subj.completedSubtopics}/{subj.totalSubtopics} subtópicos</span>
                            <span className="font-semibold" style={{ color: subj.areaColor }}>{pct}%</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
