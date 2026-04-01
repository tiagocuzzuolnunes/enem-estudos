'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardCard from './DashboardCard'
import ProgressBar from './ProgressBar'
import type { AreaCardUI, SubjectCardUI } from '@/types'

const iconMap: Record<string, string> = {
  flask: '🔬', globe: '🌍', book: '📖', calculator: '🧮', pencil: '✏️',
}

interface Props {
  areaCards: AreaCardUI[]
  subjectCards: SubjectCardUI[]
}

export default function DashboardGrid({ areaCards, subjectCards }: Props) {
  const [view, setView] = useState<'areas' | 'subjects'>('areas')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">
          {view === 'areas' ? 'Por Área' : 'Por Disciplina'}
        </h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('areas')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              view === 'areas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Áreas
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

      {view === 'areas' ? (
        areaCards.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-sm">Nenhum conteúdo encontrado.</p>
            <p className="text-gray-400 text-xs mt-1">Execute <code className="bg-gray-100 px-1 rounded">npm run seed</code> para popular o banco de dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaCards.map((area) => (
              <DashboardCard key={area._id} area={area} />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectCards.map((subj) => {
            const pct = subj.totalSubtopics > 0
              ? Math.round((subj.completedSubtopics / subj.totalSubtopics) * 100)
              : 0
            return (
              <Link key={subj._id} href={`/area/${subj.areaSlug}`}>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{iconMap[subj.areaIcon] ?? '📚'}</span>
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
      )}
    </div>
  )
}
