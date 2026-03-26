import { Schema, model, models } from 'mongoose'
import type { ISubject } from '@/types'

const SubjectSchema = new Schema<ISubject>({
  areaId: { type: Schema.Types.ObjectId, ref: 'Area', required: true },
  name:   { type: String, required: true },
  order:  { type: Number, default: 0 },
})

SubjectSchema.index({ areaId: 1, order: 1 })

export const Subject = models.Subject || model<ISubject>('Subject', SubjectSchema)
