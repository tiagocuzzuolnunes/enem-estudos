import { Schema, model, models } from 'mongoose'
import type { ISubarea } from '@/types'

const SubareaSchema = new Schema<ISubarea>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  areaId:    { type: Schema.Types.ObjectId, ref: 'Area',    required: true },
  name:      { type: String, required: true },
  order:     { type: Number, default: 0 },
})

SubareaSchema.index({ subjectId: 1, order: 1 })

export const Subarea = models.Subarea || model<ISubarea>('Subarea', SubareaSchema)
