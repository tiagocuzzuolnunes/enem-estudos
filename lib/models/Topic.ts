import { Schema, model, models } from 'mongoose'
import type { ITopic } from '@/types'

const TopicSchema = new Schema<ITopic>({
  subareaId: { type: Schema.Types.ObjectId, ref: 'Subarea',  required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject',  required: true },
  areaId:    { type: Schema.Types.ObjectId, ref: 'Area',     required: true },
  name:      { type: String, required: true },
  order:     { type: Number, default: 0 },
})

TopicSchema.index({ subareaId: 1, order: 1 })
TopicSchema.index({ areaId: 1, order: 1 })
TopicSchema.index({ subjectId: 1, order: 1 })

export const Topic = models.Topic || model<ITopic>('Topic', TopicSchema)
