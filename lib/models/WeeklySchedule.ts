import mongoose, { Schema, model, models } from 'mongoose'

export interface IWeeklySchedule {
  _id: mongoose.Types.ObjectId
  dayOfWeek: number       // 0=Sun … 6=Sat
  subjectId: string
  subjectName: string
  areaSlug: string
  areaName: string
  areaColor: string
  startDate: string       // YYYY-MM-DD — first occurrence of dayOfWeek when schedule was set
  perDay: number          // how many subtopics to show per day (default 1)
}

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>({
  dayOfWeek:   { type: Number, required: true, min: 0, max: 6 },
  subjectId:   { type: String, required: true },
  subjectName: { type: String, required: true },
  areaSlug:    { type: String, required: true },
  areaName:    { type: String, required: true },
  areaColor:   { type: String, required: true },
  startDate:   { type: String, required: true },
  perDay:      { type: Number, default: 1, min: 1 },
})

WeeklyScheduleSchema.index({ dayOfWeek: 1, subjectId: 1 })

export const WeeklySchedule = models.WeeklySchedule || model<IWeeklySchedule>('WeeklySchedule', WeeklyScheduleSchema)
