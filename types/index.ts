import { Types } from 'mongoose'

export interface IArea {
  _id: Types.ObjectId
  name: string
  slug: string
  color: string
  icon: string
  createdAt: Date
}

export interface ISubject {
  _id: Types.ObjectId
  areaId: Types.ObjectId
  name: string
  order: number
}

export interface ISubarea {
  _id: Types.ObjectId
  subjectId: Types.ObjectId
  areaId: Types.ObjectId
  name: string
  order: number
}

export interface ITopic {
  _id: Types.ObjectId
  subareaId: Types.ObjectId
  subjectId: Types.ObjectId
  areaId: Types.ObjectId
  name: string
  order: number
}

export type Priority = 'high' | 'medium' | 'low'

export interface ILink {
  title: string
  url: string
}

export interface ISubtopic {
  _id: Types.ObjectId
  topicId: Types.ObjectId
  subareaId: Types.ObjectId
  subjectId: Types.ObjectId
  areaId: Types.ObjectId
  name: string
  order: number
  videoLinks: ILink[]
  exerciseLinks: ILink[]
  priority: Priority
  completed: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ISettings {
  _id: Types.ObjectId
  enemDate: Date
  createdAt: Date
}

// UI types for the area detail page
export interface SubtopicUI {
  _id: string
  name: string
  order: number
  videoLinks: ILink[]
  exerciseLinks: ILink[]
  priority: Priority
  completed: boolean
  completedAt: string | null
}

export interface TopicUI {
  _id: string
  name: string
  order: number
  subtopics: SubtopicUI[]
}

export interface SubareaUI {
  _id: string
  name: string
  order: number
  topics: TopicUI[]
}

export interface SubjectUI {
  _id: string
  name: string
  order: number
  subareas: SubareaUI[]
}

export interface AreaDetailUI {
  _id: string
  name: string
  slug: string
  color: string
  icon: string
  subjects: SubjectUI[]
  totalSubtopics: number
  completedSubtopics: number
}

export interface AreaCardUI {
  _id: string
  name: string
  slug: string
  color: string
  icon: string
  totalSubtopics: number
  completedSubtopics: number
}
