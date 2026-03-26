'use client'

import { useState } from 'react'
import PriorityBadge from './PriorityBadge'
import type { SubtopicUI, Priority } from '@/types'

interface Props {
  subtopic: SubtopicUI
  areaColor: string
}

export default function SubtopicItem({ subtopic, areaColor }: Props) {
  const [data, setData] = useState(subtopic)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function patch(update: Partial<{ completed: boolean; priority: Priority }>) {
    setLoading(true)
    const res = await fetch(`/api/subtopics/${data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) {
      const updated = await res.json()
      setData((prev) => ({ ...prev, ...updated }))
    }
    setLoading(false)
  }

  const hasLinks = data.videoLinks.length > 0 || data.exerciseLinks.length > 0

  return (
    <div
      className={`rounded-xl border transition-colors ${
        data.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Checkbox */}
        <button
          onClick={() => patch({ completed: !data.completed })}
          disabled={loading}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            data.completed
              ? 'border-transparent text-white'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={data.completed ? { backgroundColor: areaColor, borderColor: areaColor } : {}}
        >
          {data.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${data.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {data.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <PriorityBadge priority={data.priority} />
            {hasLinks && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-blue-600 hover:underline"
              >
                {expanded ? 'Ocultar links' : `Ver links (${data.videoLinks.length + data.exerciseLinks.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Priority selector */}
        <select
          value={data.priority}
          onChange={(e) => patch({ priority: e.target.value as Priority })}
          disabled={loading}
          className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* Expanded links */}
      {expanded && hasLinks && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {data.videoLinks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vídeos</p>
              <div className="space-y-1">
                {data.videoLinks.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <span>▶</span>{l.title}
                  </a>
                ))}
              </div>
            </div>
          )}
          {data.exerciseLinks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Exercícios</p>
              <div className="space-y-1">
                {data.exerciseLinks.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-green-600 hover:underline">
                    <span>📝</span>{l.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
