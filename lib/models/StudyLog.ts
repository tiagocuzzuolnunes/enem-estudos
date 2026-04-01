import mongoose, { Schema, model, models } from 'mongoose'

export interface IStudyLog {
  _id: mongoose.Types.ObjectId
  date: string          // ISO date string YYYY-MM-DD
  subjectId: string
  subjectName: string
  areaSlug: string
  areaName: string
  areaColor: string
  createdAt: Date
}

const StudyLogSchema = new Schema<IStudyLog>({
  date:        { type: String, required: true },
  subjectId:   { type: String, required: true },
  subjectName: { type: String, required: true },
  areaSlug:    { type: String, required: true },
  areaName:    { type: String, required: true },
  areaColor:   { type: String, required: true },
  createdAt:   { type: Date, default: Date.now },
})

StudyLogSchema.index({ date: 1, subjectId: 1 })

export const StudyLog = models.StudyLog || model<IStudyLog>('StudyLog', StudyLogSchema)
