import { Schema, model, models } from 'mongoose'
import type { ISubtopic } from '@/types'

const LinkSchema = new Schema({ title: String, url: String }, { _id: false })

const SubtopicSchema = new Schema<ISubtopic>(
  {
    topicId:    { type: Schema.Types.ObjectId, ref: 'Topic',   required: true },
    subareaId:  { type: Schema.Types.ObjectId, ref: 'Subarea', required: true },
    subjectId:  { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    areaId:     { type: Schema.Types.ObjectId, ref: 'Area',    required: true },
    name:       { type: String, required: true },
    order:      { type: Number, default: 0 },
    videoLinks:    { type: [LinkSchema], default: [] },
    exerciseLinks: { type: [LinkSchema], default: [] },
    priority:   { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    completed:  { type: Boolean, default: false },
    completedAt:{ type: Date, default: null },
  },
  { timestamps: true },
)

SubtopicSchema.index({ areaId: 1 })
SubtopicSchema.index({ topicId: 1, order: 1 })

export const Subtopic = models.Subtopic || model<ISubtopic>('Subtopic', SubtopicSchema)
