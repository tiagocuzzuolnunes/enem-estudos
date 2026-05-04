'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminSubtopic { _id: string; name: string; order: number }
interface AdminTopic    { _id: string; name: string; order: number; subtopics: AdminSubtopic[] }
interface AdminSubarea  { _id: string; name: string; order: number; topics: AdminTopic[] }
interface AdminSubject  { _id: string; name: string; order: number; subareas: AdminSubarea[] }
interface AdminArea     { _id: string; name: string; slug: string; color: string }

type EditingState = { level: 'subarea' | 'topic' | 'subtopic'; id: string; value: string } | null
type AddingState =
  | { level: 'subarea';  parentId: string }
  | { level: 'topic';    parentId: string }
  | { level: 'subtopic'; parentId: string }
  | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sorted<T extends { order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.order - b.order)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [areas, setAreas]               = useState<AdminArea[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [areaId, setAreaId]             = useState<string>('')
  const [subjects, setSubjects]         = useState<AdminSubject[]>([])
  const [loading, setLoading]           = useState(false)

  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set())
  const [openSubareas, setOpenSubareas] = useState<Set<string>>(new Set())
  const [openTopics,   setOpenTopics]   = useState<Set<string>>(new Set())

  const [editing,   setEditing]   = useState<EditingState>(null)
  const [adding,    setAdding]    = useState<AddingState>(null)
  const [addValue,  setAddValue]  = useState('')

  // ── Fetch areas on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/areas')
      .then((r) => r.json())
      .then((data: AdminArea[]) => {
        setAreas(data)
        if (data.length > 0) setSelectedSlug(data[0].slug)
      })
      .catch(console.error)
  }, [])

  // ── Fetch hierarchy when slug changes ────────────────────────────────────
  const loadArea = useCallback((slug: string) => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/areas/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAreaId(data._id)
        const mapped: AdminSubject[] = (data.subjects ?? []).map((subj: any) => ({
          _id:      subj._id,
          name:     subj.name,
          order:    subj.order,
          subareas: (subj.subareas ?? []).map((sa: any) => ({
            _id:    sa._id,
            name:   sa.name,
            order:  sa.order,
            topics: (sa.topics ?? []).map((t: any) => ({
              _id:       t._id,
              name:      t.name,
              order:     t.order,
              subtopics: (t.subtopics ?? []).map((st: any) => ({
                _id:   st._id,
                name:  st.name,
                order: st.order,
              })),
            })),
          })),
        }))
        setSubjects(mapped)
        // Expand all subjects by default
        setOpenSubjects(new Set(mapped.map((s) => s._id)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSlug) loadArea(selectedSlug)
  }, [selectedSlug, loadArea])

  // ── Toggle helpers ────────────────────────────────────────────────────────
  function toggleSubject(id: string) {
    setOpenSubjects((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleSubarea(id: string) {
    setOpenSubareas((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleTopic(id: string) {
    setOpenTopics((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // ── Add operations ────────────────────────────────────────────────────────
  function startAdding(level: 'subarea' | 'topic' | 'subtopic', parentId: string) {
    setAdding({ level, parentId })
    setAddValue('')
    setEditing(null)
  }

  async function commitAdd() {
    if (!adding || !addValue.trim()) { setAdding(null); return }

    if (adding.level === 'subarea') {
      const subject = subjects.find((s) => s._id === adding.parentId)
      if (!subject) return
      const res = await fetch('/api/admin/subareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: subject._id, areaId, name: addValue }),
      })
      if (!res.ok) { console.error('Failed to add subarea'); setAdding(null); return }
      const newSa: AdminSubarea = await res.json()
      setSubjects((prev) => prev.map((s) =>
        s._id === subject._id ? { ...s, subareas: [...s.subareas, newSa] } : s
      ))
      setOpenSubareas((prev) => new Set(prev).add(newSa._id))
    }

    else if (adding.level === 'topic') {
      // parentId is subareaId — find subject via subareas
      let foundSubject: AdminSubject | undefined
      let foundSubarea: AdminSubarea | undefined
      for (const subj of subjects) {
        const sa = subj.subareas.find((a) => a._id === adding.parentId)
        if (sa) { foundSubject = subj; foundSubarea = sa; break }
      }
      if (!foundSubject || !foundSubarea) return
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subareaId: foundSubarea._id, subjectId: foundSubject._id, areaId, name: addValue }),
      })
      if (!res.ok) { console.error('Failed to add topic'); setAdding(null); return }
      const newTopic: AdminTopic = await res.json()
      setSubjects((prev) => prev.map((s) =>
        s._id !== foundSubject!._id ? s : {
          ...s,
          subareas: s.subareas.map((sa) =>
            sa._id !== foundSubarea!._id ? sa : { ...sa, topics: [...sa.topics, newTopic] }
          ),
        }
      ))
      setOpenTopics((prev) => new Set(prev).add(newTopic._id))
    }

    else if (adding.level === 'subtopic') {
      // parentId is topicId
      let foundSubject: AdminSubject | undefined
      let foundSubarea: AdminSubarea | undefined
      let foundTopic: AdminTopic | undefined
      outer: for (const subj of subjects) {
        for (const sa of subj.subareas) {
          const t = sa.topics.find((t) => t._id === adding.parentId)
          if (t) { foundSubject = subj; foundSubarea = sa; foundTopic = t; break outer }
        }
      }
      if (!foundSubject || !foundSubarea || !foundTopic) return
      const res = await fetch('/api/admin/subtopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId:   foundTopic._id,
          subareaId: foundSubarea._id,
          subjectId: foundSubject._id,
          areaId,
          name: addValue,
        }),
      })
      if (!res.ok) { console.error('Failed to add subtopic'); setAdding(null); return }
      const newSt: AdminSubtopic = await res.json()
      setSubjects((prev) => prev.map((s) =>
        s._id !== foundSubject!._id ? s : {
          ...s,
          subareas: s.subareas.map((sa) =>
            sa._id !== foundSubarea!._id ? sa : {
              ...sa,
              topics: sa.topics.map((t) =>
                t._id !== foundTopic!._id ? t : { ...t, subtopics: [...t.subtopics, newSt] }
              ),
            }
          ),
        }
      ))
    }

    setAdding(null)
    setAddValue('')
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  function startEditing(level: 'subarea' | 'topic' | 'subtopic', id: string, currentName: string) {
    setEditing({ level, id, value: currentName })
    setAdding(null)
  }

  async function commitEdit() {
    if (!editing || !editing.value.trim()) { setEditing(null); return }
    const { level, id, value } = editing
    const res = await fetch(`/api/admin/${level}s/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value.trim() }),
    })
    if (!res.ok) { console.error('Failed to rename'); setEditing(null); return }

    setSubjects((prev) => prev.map((subj) => {
      if (level === 'subarea') {
        return {
          ...subj,
          subareas: subj.subareas.map((sa) =>
            sa._id === id ? { ...sa, name: value.trim() } : sa
          ),
        }
      }
      if (level === 'topic') {
        return {
          ...subj,
          subareas: subj.subareas.map((sa) => ({
            ...sa,
            topics: sa.topics.map((t) =>
              t._id === id ? { ...t, name: value.trim() } : t
            ),
          })),
        }
      }
      if (level === 'subtopic') {
        return {
          ...subj,
          subareas: subj.subareas.map((sa) => ({
            ...sa,
            topics: sa.topics.map((t) => ({
              ...t,
              subtopics: t.subtopics.map((st) =>
                st._id === id ? { ...st, name: value.trim() } : st
              ),
            })),
          })),
        }
      }
      return subj
    }))
    setEditing(null)
  }

  // ── Delete operations ─────────────────────────────────────────────────────
  async function deleteSubarea(subareaId: string, subjectId: string, name: string) {
    if (!confirm(`Deletar subárea "${name}" e todo seu conteúdo?`)) return
    const res = await fetch(`/api/admin/subareas/${subareaId}`, { method: 'DELETE' })
    if (!res.ok) { console.error('Failed to delete subarea'); return }
    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : { ...s, subareas: s.subareas.filter((sa) => sa._id !== subareaId) }
    ))
  }

  async function deleteTopic(topicId: string, subareaId: string, subjectId: string, name: string) {
    if (!confirm(`Deletar tópico "${name}" e todos seus subtópicos?`)) return
    const res = await fetch(`/api/admin/topics/${topicId}`, { method: 'DELETE' })
    if (!res.ok) { console.error('Failed to delete topic'); return }
    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : {
        ...s,
        subareas: s.subareas.map((sa) =>
          sa._id !== subareaId ? sa : { ...sa, topics: sa.topics.filter((t) => t._id !== topicId) }
        ),
      }
    ))
  }

  async function deleteSubtopic(subtopicId: string, topicId: string, subareaId: string, subjectId: string, name: string) {
    if (!confirm(`Deletar subtópico "${name}"?`)) return
    const res = await fetch(`/api/admin/subtopics/${subtopicId}`, { method: 'DELETE' })
    if (!res.ok) { console.error('Failed to delete subtopic'); return }
    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : {
        ...s,
        subareas: s.subareas.map((sa) =>
          sa._id !== subareaId ? sa : {
            ...sa,
            topics: sa.topics.map((t) =>
              t._id !== topicId ? t : { ...t, subtopics: t.subtopics.filter((st) => st._id !== subtopicId) }
            ),
          }
        ),
      }
    ))
  }

  // ── Move (swap order) ─────────────────────────────────────────────────────
  async function moveSubarea(subareaId: string, direction: 'up' | 'down', subjectId: string) {
    const subject = subjects.find((s) => s._id === subjectId)
    if (!subject) return
    const list = sorted(subject.subareas)
    const idx = list.findIndex((sa) => sa._id === subareaId)
    const adjIdx = direction === 'up' ? idx - 1 : idx + 1
    if (adjIdx < 0 || adjIdx >= list.length) return
    const adj = list[adjIdx]

    // Optimistic update
    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : {
        ...s,
        subareas: s.subareas.map((sa) => {
          if (sa._id === subareaId) return { ...sa, order: adj.order }
          if (sa._id === adj._id)   return { ...sa, order: list[idx].order }
          return sa
        }),
      }
    ))

    const res = await fetch(`/api/admin/subareas/${subareaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swap: adj._id }),
    })
    if (!res.ok) {
      console.error('Failed to move subarea')
      loadArea(selectedSlug) // revert
    }
  }

  async function moveTopic(topicId: string, direction: 'up' | 'down', subareaId: string, subjectId: string) {
    const subject = subjects.find((s) => s._id === subjectId)
    const subarea = subject?.subareas.find((sa) => sa._id === subareaId)
    if (!subarea) return
    const list = sorted(subarea.topics)
    const idx = list.findIndex((t) => t._id === topicId)
    const adjIdx = direction === 'up' ? idx - 1 : idx + 1
    if (adjIdx < 0 || adjIdx >= list.length) return
    const adj = list[adjIdx]

    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : {
        ...s,
        subareas: s.subareas.map((sa) =>
          sa._id !== subareaId ? sa : {
            ...sa,
            topics: sa.topics.map((t) => {
              if (t._id === topicId) return { ...t, order: adj.order }
              if (t._id === adj._id) return { ...t, order: list[idx].order }
              return t
            }),
          }
        ),
      }
    ))

    const res = await fetch(`/api/admin/topics/${topicId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swap: adj._id }),
    })
    if (!res.ok) {
      console.error('Failed to move topic')
      loadArea(selectedSlug)
    }
  }

  async function moveSubtopic(subtopicId: string, direction: 'up' | 'down', topicId: string, subareaId: string, subjectId: string) {
    const subject = subjects.find((s) => s._id === subjectId)
    const subarea = subject?.subareas.find((sa) => sa._id === subareaId)
    const topic   = subarea?.topics.find((t) => t._id === topicId)
    if (!topic) return
    const list = sorted(topic.subtopics)
    const idx = list.findIndex((st) => st._id === subtopicId)
    const adjIdx = direction === 'up' ? idx - 1 : idx + 1
    if (adjIdx < 0 || adjIdx >= list.length) return
    const adj = list[adjIdx]

    setSubjects((prev) => prev.map((s) =>
      s._id !== subjectId ? s : {
        ...s,
        subareas: s.subareas.map((sa) =>
          sa._id !== subareaId ? sa : {
            ...sa,
            topics: sa.topics.map((t) =>
              t._id !== topicId ? t : {
                ...t,
                subtopics: t.subtopics.map((st) => {
                  if (st._id === subtopicId) return { ...st, order: adj.order }
                  if (st._id === adj._id)    return { ...st, order: list[idx].order }
                  return st
                }),
              }
            ),
          }
        ),
      }
    ))

    const res = await fetch(`/api/admin/subtopics/${subtopicId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swap: adj._id }),
    })
    if (!res.ok) {
      console.error('Failed to move subtopic')
      loadArea(selectedSlug)
    }
  }

  // ── Keyboard handlers ─────────────────────────────────────────────────────
  function onEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { e.preventDefault(); setEditing(null) }
  }

  function onAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); commitAdd() }
    if (e.key === 'Escape') { e.preventDefault(); setAdding(null); setAddValue('') }
  }

  // ── Reset plan ────────────────────────────────────────────────────────────
  async function resetPlan() {
    if (!confirm('Isso vai desmarcar todos os subtópicos concluídos, apagar o histórico de estudos e reiniciar as datas do calendário. Tem certeza?')) return
    await fetch('/api/admin/reset', { method: 'POST' })
    window.location.reload()
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedArea = areas.find((a) => a.slug === selectedSlug)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Reset button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={resetPlan}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          Reiniciar plano de estudos
        </button>
      </div>

      {/* Area tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {areas.map((area) => {
          const isSelected = area.slug === selectedSlug
          return (
            <button
              key={area._id}
              onClick={() => setSelectedSlug(area.slug)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={isSelected ? { backgroundColor: area.color } : {}}
            >
              {area.name}
            </button>
          )
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {/* Subjects */}
      {!loading && sorted(subjects).map((subject) => {
        const subjectOpen = openSubjects.has(subject._id)
        return (
          <div key={subject._id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            {/* Subject header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
              onClick={() => toggleSubject(subject._id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{subjectOpen ? '▼' : '▶'}</span>
                <span className="font-semibold text-gray-800 text-sm">{subject.name}</span>
                <span className="text-xs text-gray-400">({subject.subareas.length} subáreas)</span>
              </div>
            </div>

            {subjectOpen && (
              <div className="px-4 py-3 space-y-2">
                {/* Add subarea button / input */}
                {adding?.level === 'subarea' && adding.parentId === subject._id ? (
                  <div className="flex items-center gap-2 pl-2 py-1">
                    <input
                      autoFocus
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Nome da subárea..."
                      value={addValue}
                      onChange={(e) => setAddValue(e.target.value)}
                      onKeyDown={onAddKeyDown}
                    />
                    <button
                      onClick={commitAdd}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => { setAdding(null); setAddValue('') }}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startAdding('subarea', subject._id)}
                    className="text-xs text-blue-500 border border-dashed border-blue-300 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    + Nova subárea
                  </button>
                )}

                {/* Subareas */}
                {sorted(subject.subareas).map((subarea) => {
                  const subareaOpen = openSubareas.has(subarea._id)
                  const subareaList = sorted(subject.subareas)
                  const saIdx = subareaList.findIndex((s) => s._id === subarea._id)
                  const isEditingSa = editing?.level === 'subarea' && editing.id === subarea._id

                  return (
                    <div key={subarea._id} className="border border-gray-100 rounded-md overflow-hidden">
                      {/* Subarea row */}
                      <div className="group flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100">
                        <button
                          onClick={() => toggleSubarea(subarea._id)}
                          className="text-gray-400 text-xs hover:text-gray-600 flex-shrink-0"
                        >
                          {subareaOpen ? '▼' : '▶'}
                        </button>

                        {isEditingSa ? (
                          <input
                            autoFocus
                            className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={editing!.value}
                            onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                            onKeyDown={onEditKeyDown}
                            onBlur={commitEdit}
                          />
                        ) : (
                          <span className="flex-1 text-sm text-gray-700 font-medium">{subarea.name}</span>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveSubarea(subarea._id, 'up', subject._id)}
                            disabled={saIdx === 0}
                            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                            title="Mover para cima"
                          >↑</button>
                          <button
                            onClick={() => moveSubarea(subarea._id, 'down', subject._id)}
                            disabled={saIdx === subareaList.length - 1}
                            className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                            title="Mover para baixo"
                          >↓</button>
                          <button
                            onClick={() => startEditing('subarea', subarea._id, subarea.name)}
                            className="text-xs text-blue-500 hover:text-blue-700 px-1"
                            title="Renomear"
                          >✏</button>
                          <button
                            onClick={() => deleteSubarea(subarea._id, subject._id, subarea.name)}
                            className="text-xs text-red-400 hover:text-red-600 px-1"
                            title="Deletar"
                          >🗑</button>
                        </div>
                      </div>

                      {subareaOpen && (
                        <div className="pl-6 pr-3 py-2 space-y-1">
                          {/* Add topic button / input */}
                          {adding?.level === 'topic' && adding.parentId === subarea._id ? (
                            <div className="flex items-center gap-2 py-1">
                              <input
                                autoFocus
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Nome do tópico..."
                                value={addValue}
                                onChange={(e) => setAddValue(e.target.value)}
                                onKeyDown={onAddKeyDown}
                              />
                              <button
                                onClick={commitAdd}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Adicionar
                              </button>
                              <button
                                onClick={() => { setAdding(null); setAddValue('') }}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startAdding('topic', subarea._id)}
                              className="text-xs text-green-600 border border-dashed border-green-300 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                            >
                              + Novo tópico
                            </button>
                          )}

                          {/* Topics */}
                          {sorted(subarea.topics).map((topic) => {
                            const topicOpen = openTopics.has(topic._id)
                            const topicList = sorted(subarea.topics)
                            const tIdx = topicList.findIndex((t) => t._id === topic._id)
                            const isEditingT = editing?.level === 'topic' && editing.id === topic._id

                            return (
                              <div key={topic._id} className="border border-gray-100 rounded overflow-hidden">
                                {/* Topic row */}
                                <div className="group flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50">
                                  <button
                                    onClick={() => toggleTopic(topic._id)}
                                    className="text-gray-400 text-xs hover:text-gray-600 flex-shrink-0"
                                  >
                                    {topicOpen ? '▼' : '▶'}
                                  </button>

                                  {isEditingT ? (
                                    <input
                                      autoFocus
                                      className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                      value={editing!.value}
                                      onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                                      onKeyDown={onEditKeyDown}
                                      onBlur={commitEdit}
                                    />
                                  ) : (
                                    <span className="flex-1 text-sm text-gray-700">{topic.name}</span>
                                  )}

                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => moveTopic(topic._id, 'up', subarea._id, subject._id)}
                                      disabled={tIdx === 0}
                                      className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                                      title="Mover para cima"
                                    >↑</button>
                                    <button
                                      onClick={() => moveTopic(topic._id, 'down', subarea._id, subject._id)}
                                      disabled={tIdx === topicList.length - 1}
                                      className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                                      title="Mover para baixo"
                                    >↓</button>
                                    <button
                                      onClick={() => startEditing('topic', topic._id, topic.name)}
                                      className="text-xs text-blue-500 hover:text-blue-700 px-1"
                                      title="Renomear"
                                    >✏</button>
                                    <button
                                      onClick={() => deleteTopic(topic._id, subarea._id, subject._id, topic.name)}
                                      className="text-xs text-red-400 hover:text-red-600 px-1"
                                      title="Deletar"
                                    >🗑</button>
                                  </div>
                                </div>

                                {topicOpen && (
                                  <div className="pl-6 pr-3 py-2 space-y-1">
                                    {/* Add subtopic button / input */}
                                    {adding?.level === 'subtopic' && adding.parentId === topic._id ? (
                                      <div className="flex items-center gap-2 py-1">
                                        <input
                                          autoFocus
                                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                          placeholder="Nome do subtópico..."
                                          value={addValue}
                                          onChange={(e) => setAddValue(e.target.value)}
                                          onKeyDown={onAddKeyDown}
                                        />
                                        <button
                                          onClick={commitAdd}
                                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                          Adicionar
                                        </button>
                                        <button
                                          onClick={() => { setAdding(null); setAddValue('') }}
                                          className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => startAdding('subtopic', topic._id)}
                                        className="text-xs text-purple-600 border border-dashed border-purple-300 px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                                      >
                                        + Novo subtópico
                                      </button>
                                    )}

                                    {/* Subtopics */}
                                    {sorted(topic.subtopics).map((subtopic) => {
                                      const stList = sorted(topic.subtopics)
                                      const stIdx = stList.findIndex((s) => s._id === subtopic._id)
                                      const isEditingSt = editing?.level === 'subtopic' && editing.id === subtopic._id

                                      return (
                                        <div
                                          key={subtopic._id}
                                          className="group flex items-center gap-2 px-3 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-100"
                                        >
                                          <span className="text-gray-300 text-xs flex-shrink-0">—</span>

                                          {isEditingSt ? (
                                            <input
                                              autoFocus
                                              className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                              value={editing!.value}
                                              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                                              onKeyDown={onEditKeyDown}
                                              onBlur={commitEdit}
                                            />
                                          ) : (
                                            <span className="flex-1 text-sm text-gray-500">{subtopic.name}</span>
                                          )}

                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => moveSubtopic(subtopic._id, 'up', topic._id, subarea._id, subject._id)}
                                              disabled={stIdx === 0}
                                              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                                              title="Mover para cima"
                                            >↑</button>
                                            <button
                                              onClick={() => moveSubtopic(subtopic._id, 'down', topic._id, subarea._id, subject._id)}
                                              disabled={stIdx === stList.length - 1}
                                              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 px-1"
                                              title="Mover para baixo"
                                            >↓</button>
                                            <button
                                              onClick={() => startEditing('subtopic', subtopic._id, subtopic.name)}
                                              className="text-xs text-blue-500 hover:text-blue-700 px-1"
                                              title="Renomear"
                                            >✏</button>
                                            <button
                                              onClick={() => deleteSubtopic(subtopic._id, topic._id, subarea._id, subject._id, subtopic.name)}
                                              className="text-xs text-red-400 hover:text-red-600 px-1"
                                              title="Deletar"
                                            >🗑</button>
                                          </div>
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
            )}
          </div>
        )
      })}

      {!loading && subjects.length === 0 && selectedSlug && (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma disciplina encontrada para esta área.</p>
      )}
    </div>
  )
}
