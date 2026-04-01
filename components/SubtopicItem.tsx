'use client'

import { useState } from 'react'
import PriorityBadge from './PriorityBadge'
import type { SubtopicUI, Priority, ILink } from '@/types'

interface Props {
  subtopic: SubtopicUI
  areaColor: string
  linksOpen: boolean
  onToggleLinks: () => void
}

type LinkField = 'videoLinks' | 'exerciseLinks' | 'additionalLinks'

interface LinkSectionProps {
  field: LinkField
  links: ILink[]
  emptyLabel: string
  icon: React.ReactNode
  accentClass: string
  onAdd: (field: LinkField, title: string, url: string) => void
  onRemove: (field: LinkField, index: number) => void
}

function LinkSection({ field, links, emptyLabel, icon, accentClass, onAdd, onRemove }: LinkSectionProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl]     = useState('')

  function submit() {
    if (!url.trim()) return
    onAdd(field, title.trim() || url.trim(), url.trim())
    setTitle(''); setUrl(''); setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      {/* existing links */}
      {links.map((l, i) => (
        <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 group`}>
          <span className={`flex-shrink-0 ${accentClass}`}>{icon}</span>
          <a href={l.url} target="_blank" rel="noopener noreferrer"
            className={`text-xs font-medium flex-1 min-w-0 truncate ${accentClass} hover:underline`}>
            {l.title}
          </a>
          <button onClick={() => onRemove(field, i)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm leading-none flex-shrink-0">
            ×
          </button>
        </div>
      ))}

      {/* add form */}
      {open ? (
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50">
          <input
            type="text"
            placeholder="Titulo (opcional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <div className="flex gap-1.5">
            <input
              type="url"
              placeholder="URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
            <button onClick={submit} disabled={!url.trim()}
              className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors font-medium">
              OK
            </button>
            <button onClick={() => { setOpen(false); setTitle(''); setUrl('') }}
              className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
              ×
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed transition-colors text-xs font-medium
            ${links.length === 0
              ? `border-gray-200 ${accentClass} hover:bg-gray-50`
              : 'border-gray-100 text-gray-300 hover:text-gray-500 hover:border-gray-200'
            }`}>
          <span className="text-base leading-none">+</span>
          {links.length === 0 ? emptyLabel : 'Adicionar'}
        </button>
      )}
    </div>
  )
}

export default function SubtopicItem({ subtopic, areaColor, linksOpen, onToggleLinks }: Props) {
  const [data,    setData]    = useState(subtopic)
  const [loading, setLoading] = useState(false)

  async function patch(update: Partial<{ completed: boolean; priority: Priority } & Record<LinkField, ILink[]>>) {
    setLoading(true)
    const res = await fetch(`/api/subtopics/${data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) { const updated = await res.json(); setData(prev => ({ ...prev, ...updated })) }
    setLoading(false)
  }

  function handleAdd(field: LinkField, title: string, url: string) {
    const next = [...data[field], { title, url }]
    setData(prev => ({ ...prev, [field]: next }))
    patch({ [field]: next })
  }

  function handleRemove(field: LinkField, index: number) {
    const next = data[field].filter((_, i) => i !== index)
    setData(prev => ({ ...prev, [field]: next }))
    patch({ [field]: next })
  }

  const totalLinks = data.videoLinks.length + data.exerciseLinks.length + data.additionalLinks.length
  const expanded   = linksOpen

  return (
    <div className={`rounded-xl border transition-colors ${data.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
      {/* header row */}
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => patch({ completed: !data.completed })}
          disabled={loading}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            data.completed ? 'border-transparent text-white' : 'border-gray-300 hover:border-gray-400'
          }`}
          style={data.completed ? { backgroundColor: areaColor, borderColor: areaColor } : {}}
        >
          {data.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${data.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {data.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <PriorityBadge priority={data.priority} />
            <button onClick={onToggleLinks}
              className="text-xs text-blue-500 hover:underline">
              {expanded ? 'Ocultar links' : totalLinks > 0 ? `${totalLinks} link${totalLinks > 1 ? 's' : ''}` : 'Links'}
            </button>
          </div>
        </div>

        <select
          value={data.priority}
          onChange={e => patch({ priority: e.target.value as Priority })}
          disabled={loading}
          className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      {/* links panel */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Videos</p>
            <LinkSection
              field="videoLinks"
              links={data.videoLinks}
              emptyLabel="Adicionar link de video"
              icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>}
              accentClass="text-blue-500"
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Questoes</p>
            <LinkSection
              field="exerciseLinks"
              links={data.exerciseLinks}
              emptyLabel="Adicionar link de questao"
              icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>}
              accentClass="text-green-600"
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Links adicionais</p>
            <LinkSection
              field="additionalLinks"
              links={data.additionalLinks}
              emptyLabel="Adicionar link"
              icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/></svg>}
              accentClass="text-purple-600"
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>
        </div>
      )}
    </div>
  )
}
