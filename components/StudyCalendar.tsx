'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SubjectCardUI } from '@/types'

// ── types ──────────────────────────────────────────────────────────────────

interface LinkEntry { title: string; url: string }
interface TopicEntry {
  _id: string; name: string; completed: boolean
  topicName: string; topicOrder: number
  subareaId: string; subareaOrder: number; order: number
  videoLinks: LinkEntry[]; exerciseLinks: LinkEntry[]; additionalLinks: LinkEntry[]
}

interface ScheduleEntry {
  _id: string; dayOfWeek: number
  subjectId: string; subjectName: string
  areaSlug: string; areaName: string; areaColor: string
  startDate: string; perDay: number
}

interface LogEntry {
  _id: string; date: string
  subjectId: string; subjectName: string
  areaSlug: string; areaName: string; areaColor: string
}

// ── constants ──────────────────────────────────────────────────────────────

// ENEM typically in early November — adjust year as needed
const ENEM_DATE = new Date('2026-11-08T12:00:00')
const WEEKS_BEFORE_ENEM = 3

// ── helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const DAY_NAMES_FULL  = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
const MONTH_NAMES     = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function toDateStr(d: Date) { return d.toLocaleDateString('sv-SE') }

function getWeekDates(date: Date): Date[] {
  const sun = new Date(date)
  sun.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(sun); d.setDate(sun.getDate() + i); return d })
}

function hasTopicsForDate(entry: ScheduleEntry, dateStr: string, topics: TopicEntry[]): boolean {
  if (!topics.length) return false
  const date  = new Date(dateStr + 'T12:00:00')
  const start = new Date(entry.startDate + 'T12:00:00')
  if (date < start) return false
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const perDay = entry.perDay ?? 1
  if (date >= today) {
    // Future/today: carry-forward — only show if there are uncompleted topics for this session
    const ref = start > today ? start : today
    const futureOffset = Math.round((date.getTime() - ref.getTime()) / (7 * 24 * 3600 * 1000))
    const uncompleted = topics.filter(t => !t.completed)
    return futureOffset * perDay < uncompleted.length
  } else {
    // Past: position-based historical view
    const weekOffset = Math.round((date.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000))
    return weekOffset * perDay < topics.length
  }
}

function getTopicsForDate(entry: ScheduleEntry, dateStr: string, topics: TopicEntry[], countOverride?: number): TopicEntry[] {
  if (!topics.length) return []
  const date  = new Date(dateStr + 'T12:00:00')
  const start = new Date(entry.startDate + 'T12:00:00')
  if (date < start) return []
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const perDay = entry.perDay ?? 1
  const count  = countOverride ?? perDay
  if (date >= today) {
    // Future/today: distribute remaining uncompleted topics across future sessions
    // Missed sessions automatically carry forward to the next appointment
    const ref = start > today ? start : today
    const futureOffset = Math.round((date.getTime() - ref.getTime()) / (7 * 24 * 3600 * 1000))
    const uncompleted = topics.filter(t => !t.completed)
    const sliceStart = futureOffset * perDay
    if (sliceStart >= uncompleted.length) return []
    return uncompleted.slice(sliceStart, sliceStart + count)
  } else {
    // Past: original position-based behavior
    const weekOffset = Math.round((date.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000))
    const startIdx = weekOffset * perDay
    if (startIdx >= topics.length) return []
    return topics.slice(startIdx, startIdx + count)
  }
}

interface PaceResult {
  weeksNeeded: number
  weeksShort: number
  remaining: number
  total: number
  isBehind: boolean
}

function computePace(subjectId: string, topics: TopicEntry[], schedule: ScheduleEntry[]): PaceResult | null {
  if (!topics.length) return null
  const remaining = topics.filter(t => !t.completed).length
  const total = topics.length
  const daysPerWeek = schedule.filter(e => e.subjectId === subjectId).length
  if (!daysPerWeek) return null
  const perDay = schedule.find(e => e.subjectId === subjectId)?.perDay ?? 1
  const weeklyRate = daysPerWeek * perDay
  const weeksNeeded = remaining > 0 ? Math.ceil(remaining / weeklyRate) : 0
  const targetDate = new Date(ENEM_DATE)
  targetDate.setDate(targetDate.getDate() - WEEKS_BEFORE_ENEM * 7)
  const today = new Date()
  const availableWeeks = (targetDate.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000)
  const isBehind = weeksNeeded > availableWeeks
  const weeksShort = isBehind ? Math.ceil(weeksNeeded - availableWeeks) : 0
  return { weeksNeeded, weeksShort, remaining, total, isBehind }
}

function computeCompletionDate(subjectId: string, topics: TopicEntry[], schedule: ScheduleEntry[]): Date | null {
  const entries = schedule.filter(e => e.subjectId === subjectId)
  if (!entries.length || !topics.length) return null
  const remaining = topics.filter(t => !t.completed).length
  if (remaining === 0) return null // already done
  const daysPerWeek = entries.length
  const perDay = entries[0].perDay ?? 1
  const weeklyRate = daysPerWeek * perDay
  const weeksNeeded = Math.ceil(remaining / weeklyRate)
  const d = new Date()
  d.setDate(d.getDate() + weeksNeeded * 7)
  return d
}

// ── component ──────────────────────────────────────────────────────────────

interface Props { subjectCards: SubjectCardUI[] }

export default function StudyCalendar({ subjectCards }: Props) {
  const today = new Date()

  const [viewMode,     setViewMode]     = useState<'weekly' | 'monthly'>('weekly')
  const [currentDate,  setCurrentDate]  = useState(today)
  const [schedule,     setSchedule]     = useState<ScheduleEntry[]>([])
  const [topicMap,     setTopicMap]     = useState<Record<string, TopicEntry[]>>({})
  const [logs,         setLogs]         = useState<LogEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateStr(today))
  const [showEditor,   setShowEditor]   = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [pickerDay,    setPickerDay]    = useState<number | null>(null)
  const [showAlerts,   setShowAlerts]   = useState(true)

  // ── fetch schedule + topics ───────────────────────────────────────────

  const fetchSchedule = useCallback(async () => {
    const data: ScheduleEntry[] = await fetch('/api/weekly-schedule').then(r => r.json())
    setSchedule(data)
    const unique = [...new Set(data.map(e => e.subjectId))]
    const map: Record<string, TopicEntry[]> = {}
    await Promise.all(unique.map(async sid => {
      map[sid] = await fetch(`/api/topics?subjectId=${sid}`).then(r => r.json())
    }))
    setTopicMap(map)
  }, [])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  // ── fetch logs ────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let url: string
    if (viewMode === 'monthly') {
      const m = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      url = `/api/study-log?month=${m}`
    } else {
      const w = getWeekDates(currentDate)
      url = `/api/study-log?from=${toDateStr(w[0])}&to=${toDateStr(w[6])}`
    }
    setLogs(await fetch(url).then(r => r.json()))
    setLoading(false)
  }, [viewMode, currentDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // ── mutations ─────────────────────────────────────────────────────────

  const addLog = async (date: string, subj: SubjectCardUI) => {
    await fetch('/api/study-log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, subjectId: subj._id, subjectName: subj.name, areaSlug: subj.areaSlug, areaName: subj.areaName, areaColor: subj.areaColor }),
    })
    fetchLogs()
  }

  const removeLog = async (id: string) => {
    await fetch(`/api/study-log/${id}`, { method: 'DELETE' })
    fetchLogs()
  }

  const addScheduleEntry = async (dow: number, subj: SubjectCardUI) => {
    await fetch('/api/weekly-schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek: dow, subjectId: subj._id, subjectName: subj.name, areaSlug: subj.areaSlug, areaName: subj.areaName, areaColor: subj.areaColor }),
    })
    setPickerDay(null)
    fetchSchedule()
  }

  const removeScheduleEntry = async (id: string) => {
    await fetch(`/api/weekly-schedule/${id}`, { method: 'DELETE' })
    fetchSchedule()
  }

  const updatePerDay = async (id: string, perDay: number) => {
    await fetch(`/api/weekly-schedule/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perDay }),
    })
    setSchedule(prev => prev.map(e => e._id === id ? { ...e, perDay } : e))
  }

  // ── derived data ──────────────────────────────────────────────────────

  const logsByDate = logs.reduce<Record<string, LogEntry[]>>((acc, l) => {
    ;(acc[l.date] ??= []).push(l); return acc
  }, {})

  const scheduleByDow = schedule.reduce<Record<number, ScheduleEntry[]>>((acc, e) => {
    ;(acc[e.dayOfWeek] ??= []).push(e); return acc
  }, {})

  const todayStr = toDateStr(today)

  // ── persistent ENEM alerts ────────────────────────────────────────────

  const scheduledSubjectIds = new Set(schedule.map(e => e.subjectId))

  const unscheduledAlerts = useMemo(() =>
    subjectCards.filter(s => !scheduledSubjectIds.has(s._id)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [schedule, subjectCards])

  const paceAlerts = useMemo(() => {
    return subjectCards
      .filter(s => scheduledSubjectIds.has(s._id) && topicMap[s._id])
      .map(s => ({ subject: s, pace: computePace(s._id, topicMap[s._id], schedule) }))
      .filter(({ pace }) => pace?.isBehind)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, topicMap, subjectCards])

  const totalAlerts = unscheduledAlerts.length + paceAlerts.length

  // ── navigation ────────────────────────────────────────────────────────

  const prev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'monthly') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d); setSelectedDate(null)
  }
  const next = () => {
    const d = new Date(currentDate)
    if (viewMode === 'monthly') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d); setSelectedDate(null)
  }

  const navLabel = viewMode === 'monthly'
    ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : (() => {
        const w = getWeekDates(currentDate)
        const fmt = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
        return `${fmt(w[0])} - ${fmt(w[6])}`
      })()

  // ── day detail (shared between views) ────────────────────────────────

  const DayDetail = ({ dateStr }: { dateStr: string }) => {
    const [extraCount, setExtraCount] = useState<Record<string, number>>({})

    const dayLogs      = logsByDate[dateStr] ?? []
    const logBySubject = new Map(dayLogs.map(l => [l.subjectId, l]))
    const date         = new Date(dateStr + 'T12:00:00')
    const dow          = date.getDay()
    const daySched     = (scheduleByDow[dow] ?? []).filter(e => hasTopicsForDate(e, dateStr, topicMap[e.subjectId] ?? []))
    const scheduledIds = new Set(daySched.map(e => e.subjectId))
    const extraLogs    = dayLogs.filter(l => !scheduledIds.has(l.subjectId))

    const toggleSubtopic = async (entry: ScheduleEntry, topic: TopicEntry) => {
      const newCompleted = !topic.completed

      // Update subtopic in DB
      fetch(`/api/subtopics/${topic._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      })

      // Update local topicMap optimistically
      setTopicMap(prev => ({
        ...prev,
        [entry.subjectId]: prev[entry.subjectId].map(t =>
          t._id === topic._id ? { ...t, completed: newCompleted } : t
        ),
      }))

      // Study log: add when checking and no log yet, remove when unchecking
      if (newCompleted && !logBySubject.has(entry.subjectId)) {
        const subj = subjectCards.find(s => s._id === entry.subjectId)
        if (subj) addLog(dateStr, subj)
      } else if (!newCompleted && logBySubject.has(entry.subjectId)) {
        removeLog(logBySubject.get(entry.subjectId)!._id)
      }

    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 mt-3">
        <p className="text-sm font-semibold text-gray-700 capitalize">
          {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {daySched.length > 0 && (
          <div className="space-y-3">
            {daySched.map(entry => {
              const allTopics  = topicMap[entry.subjectId] ?? []
              const perDay     = entry.perDay ?? 1
              const count      = perDay + (extraCount[entry._id] ?? 0)
              const topics     = getTopicsForDate(entry, dateStr, allTopics, count)
              const todayD = new Date(); todayD.setHours(12, 0, 0, 0)
              const dateD  = new Date(dateStr + 'T12:00:00')
              const startD = new Date(entry.startDate + 'T12:00:00')
              const canAddMore = (() => {
                if (dateD >= todayD) {
                  const ref = startD > todayD ? startD : todayD
                  const futureOffset = Math.round((dateD.getTime() - ref.getTime()) / (7 * 24 * 3600 * 1000))
                  const uncompleted = allTopics.filter(t => !t.completed)
                  return futureOffset * perDay + count < uncompleted.length
                } else {
                  const weekOffset = Math.round((dateD.getTime() - startD.getTime()) / (7 * 24 * 3600 * 1000))
                  return weekOffset * perDay + count < allTopics.length
                }
              })()
              return (
                <div key={entry._id} className="rounded-xl overflow-hidden border"
                  style={{ borderColor: entry.areaColor + '40' }}>
                  <div className="px-3 py-1.5 text-xs font-bold flex items-center justify-between"
                    style={{ backgroundColor: entry.areaColor + '18', color: entry.areaColor }}>
                    <span>{entry.subjectName}</span>
                    {canAddMore && (
                      <button
                        onClick={() => setExtraCount(prev => ({ ...prev, [entry._id]: (prev[entry._id] ?? 0) + 1 }))}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: entry.areaColor + '30' }}>
                        +
                      </button>
                    )}
                  </div>
                  {topics.map((topic, idx) => (
                    <label key={topic._id}
                      className={`flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                      style={{ backgroundColor: topic.completed ? entry.areaColor + '10' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={topic.completed}
                        onChange={() => toggleSubtopic(entry, topic)}
                        className="w-4 h-4 rounded flex-shrink-0 cursor-pointer mt-0.5"
                        style={{ accentColor: entry.areaColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs leading-tight ${topic.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          <span className="font-medium">{topic.topicName}</span> — {topic.name}
                        </p>
                        {!topic.completed && (() => {
                          const sections = [
                            { links: topic.videoLinks,      icon: '▶', color: 'text-blue-500'   },
                            { links: topic.exerciseLinks,   icon: '📝', color: 'text-green-600'  },
                            { links: topic.additionalLinks, icon: '🔗', color: 'text-purple-600' },
                          ].filter(s => s.links.length > 0)
                          if (!sections.length) return null
                          return (
                            <div className="mt-1 space-y-0.5">
                              {sections.flatMap((s, si) =>
                                s.links.map((l, li) => (
                                  <a key={`${si}-${li}`} href={l.url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className={`flex items-center gap-1.5 text-xs ${s.color} hover:underline`}>
                                    <span className="flex-shrink-0">{s.icon}</span>
                                    <span className="truncate">{l.title || l.url}</span>
                                  </a>
                                ))
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </label>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {extraLogs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {extraLogs.map(log => (
              <span key={log._id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: log.areaColor }}>
                {log.subjectName}
                <button onClick={() => removeLog(log._id)} className="opacity-70 hover:opacity-100 ml-0.5">x</button>
              </span>
            ))}
          </div>
        )}

        {daySched.length === 0 && dayLogs.length === 0 && (
          <p className="text-xs text-gray-400">Nenhuma disciplina planejada para este dia.</p>
        )}
      </div>
    )
  }

  // ── monthly view ──────────────────────────────────────────────────────

  const MonthlyView = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDow    = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    const yr = currentDate.getFullYear(), mo = currentDate.getMonth()

    return (
      <>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} className="border-b border-r border-gray-50 h-16" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dow     = (firstDow + i) % 7
              const dayLogs  = logsByDate[dateStr] ?? []
              const daySched = (scheduleByDow[dow] ?? []).filter(e => hasTopicsForDate(e, dateStr, topicMap[e.subjectId] ?? []))
              const isToday  = dateStr === todayStr
              const isSel    = dateStr === selectedDate
              const allDots  = [
                ...daySched.map(e => ({ color: e.areaColor, key: 'sc' + e._id })),
                ...dayLogs.map(l  => ({ color: l.areaColor,  key: 'lg' + l._id  })),
              ]

              return (
                <div key={dateStr} onClick={() => setSelectedDate(isSel ? null : dateStr)}
                  className={`border-b h-16 p-1 cursor-pointer transition-colors relative
                    ${dow < 6 ? 'border-r' : ''} border-gray-50
                    ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-500 text-white' : 'text-gray-600'}`}>{day}</span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {allDots.slice(0, 4).map(d => (
                      <span key={d.key} className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    ))}
                    {allDots.length > 4 && <span className="text-gray-400" style={{ fontSize: 8 }}>+{allDots.length - 4}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {selectedDate && <DayDetail dateStr={selectedDate} />}
      </>
    )
  }

  // ── weekly view ───────────────────────────────────────────────────────

  const WeeklyView = () => {
    const weekDates = getWeekDates(currentDate)

    return (
      <>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[560px]">
            {weekDates.map((date, dow) => {
              const dateStr  = toDateStr(date)
              const isToday  = dateStr === todayStr
              const isSel    = dateStr === selectedDate
              const dayLogs  = logsByDate[dateStr] ?? []
              const daySched = (scheduleByDow[dow] ?? []).filter(e => hasTopicsForDate(e, dateStr, topicMap[e.subjectId] ?? []))

              return (
                <div key={dateStr}
                  className={`rounded-xl border p-2 cursor-pointer transition-colors
                    ${isSel ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                  onClick={() => setSelectedDate(isSel ? null : dateStr)}>

                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-400">{DAY_NAMES_SHORT[dow]}</p>
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto
                      ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>{date.getDate()}</span>
                  </div>

                  <div className="space-y-1.5">
                    {daySched.map(entry => {
                      const topics = getTopicsForDate(entry, dateStr, topicMap[entry.subjectId] ?? [])
                      const linkCount = topics.reduce((sum, t) =>
                        sum + (t.videoLinks?.length ?? 0) + (t.exerciseLinks?.length ?? 0) + (t.additionalLinks?.length ?? 0), 0)
                      return (
                        <div key={entry._id} className="rounded-lg p-1.5 text-left" style={{ backgroundColor: entry.areaColor + '20' }}>
                          <p className="text-xs font-semibold leading-tight" style={{ color: entry.areaColor }}>{entry.subjectName}</p>
                          {topics.map(topic => (
                            <p key={topic._id} className={`text-xs leading-tight mt-0.5 truncate ${topic.completed ? 'line-through text-gray-400' : 'text-gray-500'}`}
                              title={`${topic.topicName} — ${topic.name}`}>
                              {topic.topicName} — {topic.name}
                            </p>
                          ))}
                          {linkCount > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{linkCount} link{linkCount > 1 ? 's' : ''}</p>
                          )}
                        </div>
                      )
                    })}
                    {dayLogs.map(log => (
                      <span key={log._id} className="block text-xs text-white rounded px-1.5 py-0.5 truncate"
                        style={{ backgroundColor: log.areaColor }}>{log.subjectName}</span>
                    ))}
                    {daySched.length === 0 && dayLogs.length === 0 && (
                      <p className="text-xs text-gray-300 text-center py-1">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {selectedDate && <DayDetail dateStr={selectedDate} />}
      </>
    )
  }

  // ── schedule editor ───────────────────────────────────────────────────

  const ScheduleEditor = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
      <p className="text-sm font-semibold text-gray-700 mb-3">Configurar semana fixa</p>
      {DAY_NAMES_FULL.map((dayName, dow) => {
        const entries  = scheduleByDow[dow] ?? []
        const assigned = new Set(entries.map(e => e.subjectId))
        const available = subjectCards.filter(s => !assigned.has(s._id))
        return (
          <div key={dow} className="flex flex-wrap items-center gap-1.5 py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">{dayName}</span>
            {entries.map(entry => (
              <span key={entry._id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: entry.areaColor }}>
                {entry.subjectName}
                {/* per-day counter */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (entry.perDay > 1) updatePerDay(entry._id, entry.perDay - 1) }}
                  className="opacity-80 hover:opacity-100 font-bold px-0.5">−</button>
                <span className="mx-0.5 opacity-90">{entry.perDay ?? 1}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); updatePerDay(entry._id, (entry.perDay ?? 1) + 1) }}
                  className="opacity-80 hover:opacity-100 font-bold px-0.5">+</button>
                <button onClick={() => removeScheduleEntry(entry._id)} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
              </span>
            ))}
            {pickerDay === dow ? (
              <div className="flex flex-wrap gap-1 mt-1 w-full pl-16">
                {available.map(subj => (
                  <button key={subj._id} onClick={() => addScheduleEntry(dow, subj)}
                    className="text-xs px-2 py-0.5 rounded-full border font-medium transition-all hover:text-white"
                    style={{ borderColor: subj.areaColor, color: subj.areaColor }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = subj.areaColor)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                    {subj.name}
                  </button>
                ))}
                <button onClick={() => setPickerDay(null)}
                  className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            ) : available.length > 0 ? (
              <button onClick={() => setPickerDay(dow)}
                className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                + Adicionar
              </button>
            ) : null}
          </div>
        )
      })}
      <p className="text-xs text-gray-400 pt-1">Use − e + para ajustar quantos subtópicos estudar por dia em cada disciplina.</p>
    </div>
  )

  // ── render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* persistent ENEM alert panel */}
      {totalAlerts > 0 && (
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 overflow-hidden">
          <button
            onClick={() => setShowAlerts(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <div>
                <p className="text-sm font-bold text-red-700">
                  {totalAlerts} alerta{totalAlerts > 1 ? 's' : ''} para o ENEM
                </p>
                <p className="text-xs text-red-500">
                  ENEM: {ENEM_DATE.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} — limite 3 semanas antes
                </p>
              </div>
            </div>
            <span className="text-red-400 text-lg">{showAlerts ? '▲' : '▼'}</span>
          </button>

          {showAlerts && (
            <div className="border-t border-red-200 divide-y divide-red-100">
              {unscheduledAlerts.map(s => (
                <div key={s._id} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-base flex-shrink-0 mt-0.5">📅</span>
                  <div>
                    <p className="text-xs font-bold text-red-700">{s.name} — não está no calendário</p>
                    <p className="text-xs text-red-500 mt-0.5">Adicione esta disciplina à semana no Configurar para garantir cobertura até o ENEM.</p>
                  </div>
                </div>
              ))}
              {paceAlerts.map(({ subject: s, pace }) => pace && (
                <div key={s._id} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-base flex-shrink-0 mt-0.5">⏱️</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-700">{s.name} — ritmo insuficiente</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      {pace.remaining} de {pace.total} subtópicos restantes.
                      No ritmo atual você termina <span className="font-semibold">{pace.weeksShort} semana{pace.weeksShort > 1 ? 's' : ''} depois</span> do prazo (3 sem. antes do ENEM).
                    </p>
                    <div className="mt-1.5 h-1.5 bg-red-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${Math.round(((pace.total - pace.remaining) / pace.total) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-red-400 mt-0.5">{Math.round(((pace.total - pace.remaining) / pace.total) * 100)}% concluído</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['weekly', 'monthly'] as const).map(m => (
            <button key={m} onClick={() => { setViewMode(m); setSelectedDate(null) }}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m === 'weekly' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700 flex-1 text-center">{navLabel}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button onClick={() => setShowEditor(e => !e)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border
            ${showEditor ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Configurar
        </button>
      </div>

      {showEditor && <ScheduleEditor />}

      {loading && <p className="text-xs text-center text-gray-400 py-2">Carregando...</p>}
      {!loading && (viewMode === 'monthly' ? <MonthlyView /> : <WeeklyView />)}
      {/* completion dates panel */}
      {schedule.length > 0 && (() => {
        const uniqueSubjects = [...new Map(schedule.map(e => [e.subjectId, e])).values()]
        const items = uniqueSubjects.map(e => {
          const topics = topicMap[e.subjectId] ?? []
          const total = topics.length
          const remaining = topics.filter(t => !t.completed).length
          const completed = topics.filter(t => t.completed).length
          const done = remaining === 0 && total > 0
          const completionDate = computeCompletionDate(e.subjectId, topics, schedule)
          return { entry: e, total, remaining, completed, done, completionDate }
        }).filter(it => it.total > 0)
        if (!items.length) return null
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Previsão de conclusão</p>
            <div className="space-y-2">
              {items.map(({ entry: e, total, completed, done, completionDate }) => (
                <div key={e.subjectId} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.areaColor }} />
                  <span className="text-xs font-medium text-gray-700 flex-1 min-w-0 truncate">{e.subjectName}</span>
                  <div className="text-right flex-shrink-0">
                    {done ? (
                      <span className="text-xs font-semibold text-green-600">Concluído</span>
                    ) : completionDate ? (
                      <span className="text-xs text-gray-500">
                        {completionDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="ml-1 text-gray-400">({completed}/{total})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
