import { Schema, model, models } from 'mongoose'
import type { ISettings } from '@/types'

const SettingsSchema = new Schema<ISettings>({
  enemDate:  { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const Settings = models.Settings || model<ISettings>('Settings', SettingsSchema)
