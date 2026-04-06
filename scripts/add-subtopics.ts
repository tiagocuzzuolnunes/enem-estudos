/**
 * Additive subtopic inserter — safe to run at any time.
 * Never deletes or modifies existing documents.
 *
 * Usage:
 *   npx tsx scripts/add-subtopics.ts
 *
 * How to use:
 *   1. Fill in ADDITIONS below with the subtopics you want to add.
 *   2. Use exact names for area/subject/subarea/topic (case-sensitive).
 *      If a subarea or topic doesn't exist yet it will be created.
 *   3. Run the script — already-existing subtopics (same name + topicId) are skipped.
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enem-estudos'

const AreaSchema     = new mongoose.Schema({ name: String, slug: String })
const SubjectSchema  = new mongoose.Schema({ areaId: mongoose.Types.ObjectId, name: String, order: Number })
const SubareaSchema  = new mongoose.Schema({ subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId, name: String, order: Number })
const TopicSchema    = new mongoose.Schema({ subareaId: mongoose.Types.ObjectId, subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId, name: String, order: Number })
const SubtopicSchema = new mongoose.Schema({
  topicId: mongoose.Types.ObjectId, subareaId: mongoose.Types.ObjectId,
  subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId,
  name: String, order: Number,
  videoLinks:      [{ title: String, url: String }],
  exerciseLinks:   [{ title: String, url: String }],
  additionalLinks: [{ title: String, url: String }],
  priority: { type: String, default: 'medium' },
  completed: { type: Boolean, default: false },
}, { timestamps: true })

const Area     = mongoose.model('Area',     AreaSchema)
const Subject  = mongoose.model('Subject',  SubjectSchema)
const Subarea  = mongoose.model('Subarea',  SubareaSchema)
const Topic    = mongoose.model('Topic',    TopicSchema)
const Subtopic = mongoose.model('Subtopic', SubtopicSchema)

// ─────────────────────────────────────────────────────────────────────────────
// EDIT THIS SECTION to add your subtopics.
//
// Each entry targets:  areaSlug → subjectName → subareaName → topicName → subtopics[]
//
// - areaSlug:    'linguagens' | 'redacao' | 'ciencias-humanas' | 'matematica' | 'ciencias-natureza'
// - subjectName: exact name as stored in DB (e.g. "Língua Portuguesa e Literatura")
// - subareaName: existing subarea name, or a new one (will be created if missing)
// - topicName:   existing topic name, or a new one (will be created if missing)
// - subtopics:   list of subtopic names to add (skipped if name already exists under that topic)
// ─────────────────────────────────────────────────────────────────────────────
const ADDITIONS = [
  {
    areaSlug:    'linguagens',
    subjectName: 'Língua Portuguesa e Literatura',
    subareaName: 'Gramática e Linguística',
    topicName:   'Morfossintaxe',
    subtopics:   ['Pontuação', 'Figuras de sintaxe'],
  },
  // Add more entries here following the same structure:
  // {
  //   areaSlug:    'matematica',
  //   subjectName: 'Matemática',
  //   subareaName: 'Álgebra',
  //   topicName:   'Funções',
  //   subtopics:   ['Função exponencial', 'Função logarítmica'],
  // },
]
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB\n')

  let created = 0, skipped = 0

  for (const entry of ADDITIONS) {
    const area = await Area.findOne({ slug: entry.areaSlug }).lean()
    if (!area) { console.error(`Area not found: ${entry.areaSlug}`); continue }

    const subject = await Subject.findOne({ areaId: area._id, name: entry.subjectName }).lean()
    if (!subject) { console.error(`Subject not found: ${entry.subjectName}`); continue }

    // Find or create subarea
    let subarea = await Subarea.findOne({ subjectId: subject._id, name: entry.subareaName }).lean()
    if (!subarea) {
      const maxOrder = await Subarea.countDocuments({ subjectId: subject._id })
      subarea = (await Subarea.create({ subjectId: subject._id, areaId: area._id, name: entry.subareaName, order: maxOrder })).toObject()
      console.log(`  Created subarea: ${entry.subareaName}`)
    }

    // Find or create topic
    let topic = await Topic.findOne({ subareaId: subarea._id, name: entry.topicName }).lean()
    if (!topic) {
      const maxOrder = await Topic.countDocuments({ subareaId: subarea._id })
      topic = (await Topic.create({ subareaId: subarea._id, subjectId: subject._id, areaId: area._id, name: entry.topicName, order: maxOrder })).toObject()
      console.log(`  Created topic: ${entry.topicName}`)
    }

    // Insert subtopics (skip duplicates by name)
    const existing = await Subtopic.find({ topicId: topic._id }).lean()
    const existingNames = new Set(existing.map((s: any) => s.name))
    const maxOrder = existing.length

    for (let i = 0; i < entry.subtopics.length; i++) {
      const name = entry.subtopics[i]
      if (existingNames.has(name)) {
        console.log(`  SKIP  [${entry.topicName}] ${name}`)
        skipped++
        continue
      }
      await Subtopic.create({
        topicId:   topic._id,
        subareaId: subarea._id,
        subjectId: subject._id,
        areaId:    area._id,
        name,
        order:     maxOrder + i,
        priority:  'medium',
        completed: false,
      })
      console.log(`  ADD   [${entry.topicName}] ${name}`)
      created++
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`)
  await mongoose.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
