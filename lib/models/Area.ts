import mongoose, { Schema, model, models } from 'mongoose'
import type { IArea } from '@/types'

const AreaSchema = new Schema<IArea>({
  name:      { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  color:     { type: String, required: true },
  icon:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const Area = models.Area || model<IArea>('Area', AreaSchema)
